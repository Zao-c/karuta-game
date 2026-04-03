'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Upload,
  Download,
  MusicNote,
  PlayArrow,
  ArrowBack,
  LibraryMusic,
} from '@mui/icons-material';
import { songLibraryService, SongLibrary, Song } from '../lib/songLibraryService';
import AudioPlayer from './AudioPlayer';
import { storageService } from '../lib/storageService';

type SongLibraryManagerProps = {
  onBack: () => void;
  onSelectLibrary?: (libraryId: string) => void;
};

export default function SongLibraryManager({ onBack, onSelectLibrary }: SongLibraryManagerProps) {
  const [libraries, setLibraries] = useState<SongLibrary[]>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<SongLibrary | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addSongDialogOpen, setAddSongDialogOpen] = useState(false);
  const [editSongDialogOpen, setEditSongDialogOpen] = useState(false);
  const [newLibraryName, setNewLibraryName] = useState('');
  const [newLibraryDesc, setNewLibraryDesc] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  
  const [newSong, setNewSong] = useState<Partial<Song>>({
    title: '',
    artist: '',
    anime: '',
    audioFile: '',
    audioUrl: '',
    coverImage: '',
    duration: 180,
    sampleStart: 0,
    sampleDuration: 15,
    difficulty: 'medium',
    tags: [],
  });
  
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addAudioInputRef = useRef<HTMLInputElement>(null);
  const addCoverInputRef = useRef<HTMLInputElement>(null);
  const editAudioInputRef = useRef<HTMLInputElement>(null);
  const editCoverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAsset, setUploadingAsset] = useState<'add-audio' | 'add-cover' | 'edit-audio' | 'edit-cover' | null>(null);

  const loadLibraries = useCallback(async () => {
    setLibraries(songLibraryService.getLibraries());
    try {
      const syncedLibraries = await songLibraryService.syncWithCloud();
      setLibraries(syncedLibraries);
    } catch (error) {
      console.error('Failed to sync song libraries:', error);
    }
  }, []);

  useEffect(() => {
    void loadLibraries();
  }, [loadLibraries]);

  const uploadSongAsset = useCallback(async (
    file: File,
    kind: 'audio' | 'cover',
    mode: 'add' | 'edit',
  ) => {
    const bucket = kind === 'audio' ? 'song-audio' : 'cover-images';
    const folder = kind === 'audio' ? 'songs' : 'covers';
    const uploadKey = `${mode}-${kind}` as 'add-audio' | 'add-cover' | 'edit-audio' | 'edit-cover';

    setUploadingAsset(uploadKey);
    try {
      const uploadResult = await storageService.uploadPublicFile({
        bucket,
        file,
        fileName: file.name,
        folder,
        contentType: file.type || undefined,
      });

      if (mode === 'add') {
        if (kind === 'audio') {
          setNewSong(prev => ({ ...prev, audioUrl: uploadResult.publicUrl, audioFile: uploadResult.publicUrl }));
        } else {
          setNewSong(prev => ({ ...prev, coverImage: uploadResult.publicUrl }));
        }
      } else if (editingSong) {
        if (kind === 'audio') {
          setEditingSong(prev => prev ? { ...prev, audioUrl: uploadResult.publicUrl, audioFile: uploadResult.publicUrl } : null);
        } else {
          setEditingSong(prev => prev ? { ...prev, coverImage: uploadResult.publicUrl } : null);
        }
      }

      setSnackbar({
        open: true,
        message: kind === 'audio' ? '音频已上传到云端' : '封面已上传到云端',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `${kind === 'audio' ? '音频' : '封面'}上传失败: ${error instanceof Error ? error.message : '请稍后重试'}`,
        severity: 'error',
      });
    } finally {
      setUploadingAsset(null);
    }
  }, [editingSong]);

  const handleCreateLibrary = useCallback(async () => {
    if (!newLibraryName.trim()) {
      setSnackbar({ open: true, message: '请输入歌曲库名称', severity: 'error' });
      return;
    }

    try {
      await songLibraryService.saveLibraryAsync({
        name: newLibraryName.trim(),
        description: newLibraryDesc.trim(),
      });

      setNewLibraryName('');
      setNewLibraryDesc('');
      setCreateDialogOpen(false);
      await loadLibraries();
      setSnackbar({ open: true, message: '歌曲库创建成功', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: `歌曲库创建失败: ${error instanceof Error ? error.message : '请稍后重试'}`, severity: 'error' });
    }
  }, [loadLibraries, newLibraryName, newLibraryDesc]);

  const handleDeleteLibrary = useCallback(async (libraryId: string) => {
    if (confirm('确定要删除这个歌曲库吗？所有歌曲将被删除。')) {
      try {
        await songLibraryService.deleteLibraryAsync(libraryId);
        await loadLibraries();
        if (selectedLibrary?.id === libraryId) {
          setSelectedLibrary(null);
        }
        setSnackbar({ open: true, message: '歌曲库已删除', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: `歌曲库删除失败: ${error instanceof Error ? error.message : '请稍后重试'}`, severity: 'error' });
      }
    }
  }, [loadLibraries, selectedLibrary]);

  const handleExportLibrary = useCallback((library: SongLibrary) => {
    const jsonStr = songLibraryService.exportLibrary(library.id);
    if (jsonStr) {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${library.name}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: '导出成功', severity: 'success' });
    }
  }, []);

  const handleImportLibrary = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const library = songLibraryService.importLibrary(content);
      if (library) {
        void loadLibraries();
        setSnackbar({ open: true, message: `成功导入「${library.name}」，共${library.songs.length}首歌曲`, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: '导入失败，请检查文件格式', severity: 'error' });
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [loadLibraries]);

  const handleAddSong = useCallback(async () => {
    if (!selectedLibrary) return;
    
    if (!newSong.title || !newSong.anime) {
      setSnackbar({ open: true, message: '请填写歌曲名称和动画名称', severity: 'error' });
      return;
    }

    try {
      await songLibraryService.addSongAsync(selectedLibrary.id, {
        title: newSong.title || '',
        artist: newSong.artist || '未知歌手',
        anime: newSong.anime || '',
        audioFile: newSong.audioFile || newSong.audioUrl || '',
        audioUrl: newSong.audioUrl || '',
        coverImage: newSong.coverImage || '',
        duration: newSong.duration || 180,
        sampleStart: newSong.sampleStart || 0,
        sampleDuration: newSong.sampleDuration || 15,
        difficulty: newSong.difficulty || 'medium',
        tags: newSong.tags || [],
      });

      setSelectedLibrary(songLibraryService.getLibrary(selectedLibrary.id));
      setNewSong({
        title: '',
        artist: '',
        anime: '',
        audioFile: '',
        audioUrl: '',
        coverImage: '',
        duration: 180,
        sampleStart: 0,
        sampleDuration: 15,
        difficulty: 'medium',
        tags: [],
      });
      setAddSongDialogOpen(false);
      setSnackbar({ open: true, message: '歌曲添加成功', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: `歌曲添加失败: ${error instanceof Error ? error.message : '请稍后重试'}`, severity: 'error' });
    }
  }, [selectedLibrary, newSong]);

  const handleEditSong = useCallback(async () => {
    if (!selectedLibrary || !editingSong) return;

    try {
      await songLibraryService.updateSongAsync(selectedLibrary.id, editingSong.id, editingSong);
      setSelectedLibrary(songLibraryService.getLibrary(selectedLibrary.id));
      setEditingSong(null);
      setEditSongDialogOpen(false);
      setSnackbar({ open: true, message: '歌曲更新成功', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: `歌曲更新失败: ${error instanceof Error ? error.message : '请稍后重试'}`, severity: 'error' });
    }
  }, [selectedLibrary, editingSong]);

  const handleDeleteSong = useCallback(async (songId: string) => {
    if (!selectedLibrary) return;
    
    if (confirm('确定要删除这首歌曲吗？')) {
      try {
        await songLibraryService.deleteSongAsync(selectedLibrary.id, songId);
        setSelectedLibrary(songLibraryService.getLibrary(selectedLibrary.id));
        setSnackbar({ open: true, message: '歌曲已删除', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: `歌曲删除失败: ${error instanceof Error ? error.message : '请稍后重试'}`, severity: 'error' });
      }
    }
  }, [selectedLibrary]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#888';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return '未知';
    }
  };

  if (selectedLibrary) {
    return (
      <Box sx={{ p: 3 }}>
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImportLibrary}
        />
        <input
          type="file"
          ref={addAudioInputRef}
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void uploadSongAsset(file, 'audio', 'add');
            }
            if (addAudioInputRef.current) addAudioInputRef.current.value = '';
          }}
        />
        <input
          type="file"
          ref={addCoverInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void uploadSongAsset(file, 'cover', 'add');
            }
            if (addCoverInputRef.current) addCoverInputRef.current.value = '';
          }}
        />
        <input
          type="file"
          ref={editAudioInputRef}
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void uploadSongAsset(file, 'audio', 'edit');
            }
            if (editAudioInputRef.current) editAudioInputRef.current.value = '';
          }}
        />
        <input
          type="file"
          ref={editCoverInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void uploadSongAsset(file, 'cover', 'edit');
            }
            if (editCoverInputRef.current) editCoverInputRef.current.value = '';
          }}
        />
        
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={() => setSelectedLibrary(null)}>
              <ArrowBack />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                🎵 {selectedLibrary.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedLibrary.description || '暂无描述'} · {selectedLibrary.songs.length}首歌曲
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddSongDialogOpen(true)}
              sx={{
                background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
              }}
            >
              添加歌曲
            </Button>
          </Stack>
        </Paper>

        {selectedLibrary.songs.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <MusicNote sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
            <Typography color="text.secondary">
              还没有歌曲，点击上方按钮添加
            </Typography>
          </Paper>
        ) : (
          <List>
            {selectedLibrary.songs.map((song, index) => (
              <Paper key={song.id} sx={{ mb: 2 }}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h6">{song.title}</Typography>
                        <Chip
                          label={getDifficultyLabel(song.difficulty)}
                          size="small"
                          sx={{
                            bgcolor: getDifficultyColor(song.difficulty) + '20',
                            color: getDifficultyColor(song.difficulty),
                          }}
                        />
                      </Stack>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {song.artist} · {song.anime}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          试听: {song.sampleStart}s - {song.sampleStart + song.sampleDuration}s ({song.sampleDuration}秒)
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingSong(song);
                          setEditSongDialogOpen(true);
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteSong(song.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
              </Paper>
            ))}
          </List>
        )}

        <Dialog open={addSongDialogOpen} onClose={() => setAddSongDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>添加歌曲</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="歌曲名称"
                fullWidth
                value={newSong.title || ''}
                onChange={(e) => setNewSong(prev => ({ ...prev, title: e.target.value }))}
                required
              />
              <TextField
                label="歌手"
                fullWidth
                value={newSong.artist || ''}
                onChange={(e) => setNewSong(prev => ({ ...prev, artist: e.target.value }))}
              />
              <TextField
                label="动画名称"
                fullWidth
                value={newSong.anime || ''}
                onChange={(e) => setNewSong(prev => ({ ...prev, anime: e.target.value }))}
                required
              />
              <TextField
                label="音频URL"
                fullWidth
                value={newSong.audioUrl || ''}
                onChange={(e) => setNewSong(prev => ({ ...prev, audioUrl: e.target.value }))}
                placeholder="https://example.com/song.mp3"
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="outlined"
                  startIcon={<Upload />}
                  onClick={() => addAudioInputRef.current?.click()}
                  disabled={uploadingAsset === 'add-audio'}
                >
                  {uploadingAsset === 'add-audio' ? '上传中...' : '上传音频'}
                </Button>
                {newSong.audioUrl && (
                  <Typography variant="body2" color="text.secondary">
                    已绑定云端音频地址
                  </Typography>
                )}
              </Stack>
              <TextField
                label="封面图片 URL"
                fullWidth
                value={newSong.coverImage || ''}
                onChange={(e) => setNewSong(prev => ({ ...prev, coverImage: e.target.value }))}
                placeholder="https://example.com/cover.jpg"
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="outlined"
                  startIcon={<Upload />}
                  onClick={() => addCoverInputRef.current?.click()}
                  disabled={uploadingAsset === 'add-cover'}
                >
                  {uploadingAsset === 'add-cover' ? '上传中...' : '上传封面'}
                </Button>
                {newSong.coverImage && (
                  <Typography variant="body2" color="text.secondary">
                    已绑定云端封面地址
                  </Typography>
                )}
              </Stack>
              <FormControl fullWidth>
                <InputLabel>难度</InputLabel>
                <Select
                  value={newSong.difficulty || 'medium'}
                  label="难度"
                  onChange={(e) => setNewSong(prev => ({ ...prev, difficulty: e.target.value as any }))}
                >
                  <MenuItem value="easy">简单</MenuItem>
                  <MenuItem value="medium">中等</MenuItem>
                  <MenuItem value="hard">困难</MenuItem>
                </Select>
              </FormControl>
              <Box>
                <Typography sx={{ mb: 1 }}>试听开始时间: {newSong.sampleStart}秒</Typography>
                <Slider
                  value={newSong.sampleStart || 0}
                  min={0}
                  max={300}
                  onChange={(_, value) => setNewSong(prev => ({ ...prev, sampleStart: value as number }))}
                />
              </Box>
              <Box>
                <Typography sx={{ mb: 1 }}>试听时长: {newSong.sampleDuration}秒</Typography>
                <Slider
                  value={newSong.sampleDuration || 15}
                  min={5}
                  max={30}
                  step={5}
                  onChange={(_, value) => setNewSong(prev => ({ ...prev, sampleDuration: value as number }))}
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddSongDialogOpen(false)}>取消</Button>
            <Button variant="contained" onClick={handleAddSong}>添加</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={editSongDialogOpen} onClose={() => setEditSongDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>编辑歌曲</DialogTitle>
          <DialogContent>
            {editingSong && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="歌曲名称"
                  fullWidth
                  value={editingSong.title}
                  onChange={(e) => setEditingSong(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
                <TextField
                  label="歌手"
                  fullWidth
                  value={editingSong.artist}
                  onChange={(e) => setEditingSong(prev => prev ? { ...prev, artist: e.target.value } : null)}
                />
                <TextField
                  label="动画名称"
                  fullWidth
                  value={editingSong.anime}
                  onChange={(e) => setEditingSong(prev => prev ? { ...prev, anime: e.target.value } : null)}
                />
                <TextField
                  label="音频URL"
                  fullWidth
                  value={editingSong.audioUrl || ''}
                  onChange={(e) => setEditingSong(prev => prev ? { ...prev, audioUrl: e.target.value } : null)}
                />
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    variant="outlined"
                    startIcon={<Upload />}
                    onClick={() => editAudioInputRef.current?.click()}
                    disabled={uploadingAsset === 'edit-audio'}
                  >
                    {uploadingAsset === 'edit-audio' ? '上传中...' : '上传音频'}
                  </Button>
                  {editingSong.audioUrl && (
                    <Typography variant="body2" color="text.secondary">
                      已绑定云端音频地址
                    </Typography>
                  )}
                </Stack>
                <TextField
                  label="封面图片 URL"
                  fullWidth
                  value={editingSong.coverImage || ''}
                  onChange={(e) => setEditingSong(prev => prev ? { ...prev, coverImage: e.target.value } : null)}
                />
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    variant="outlined"
                    startIcon={<Upload />}
                    onClick={() => editCoverInputRef.current?.click()}
                    disabled={uploadingAsset === 'edit-cover'}
                  >
                    {uploadingAsset === 'edit-cover' ? '上传中...' : '上传封面'}
                  </Button>
                  {editingSong.coverImage && (
                    <Typography variant="body2" color="text.secondary">
                      已绑定云端封面地址
                    </Typography>
                  )}
                </Stack>
                <FormControl fullWidth>
                  <InputLabel>难度</InputLabel>
                  <Select
                    value={editingSong.difficulty}
                    label="难度"
                    onChange={(e) => setEditingSong(prev => prev ? { ...prev, difficulty: e.target.value as any } : null)}
                  >
                    <MenuItem value="easy">简单</MenuItem>
                    <MenuItem value="medium">中等</MenuItem>
                    <MenuItem value="hard">困难</MenuItem>
                  </Select>
                </FormControl>
                <Box>
                  <Typography sx={{ mb: 1 }}>试听开始时间: {editingSong.sampleStart}秒</Typography>
                  <Slider
                    value={editingSong.sampleStart}
                    min={0}
                    max={300}
                    onChange={(_, value) => setEditingSong(prev => prev ? { ...prev, sampleStart: value as number } : null)}
                  />
                </Box>
                <Box>
                  <Typography sx={{ mb: 1 }}>试听时长: {editingSong.sampleDuration}秒</Typography>
                  <Slider
                    value={editingSong.sampleDuration}
                    min={5}
                    max={30}
                    step={5}
                    onChange={(_, value) => setEditingSong(prev => prev ? { ...prev, sampleDuration: value as number } : null)}
                  />
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditSongDialogOpen(false)}>取消</Button>
            <Button variant="contained" onClick={handleEditSong}>保存</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportLibrary}
      />
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={onBack}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              🎵 歌曲库管理
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Upload />}
              onClick={() => fileInputRef.current?.click()}
            >
              导入
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
              }}
            >
              创建歌曲库
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {libraries.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <LibraryMusic sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            还没有歌曲库
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            创建一个歌曲库开始添加歌曲吧！
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
            }}
          >
            创建歌曲库
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {libraries.map((library) => (
            <Grid item xs={12} sm={6} md={4} key={library.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {library.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {library.description || '暂无描述'}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      icon={<MusicNote />}
                      label={`${library.songs.length}首`}
                      size="small"
                    />
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => setSelectedLibrary(library)}
                  >
                    管理
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Download />}
                    onClick={() => handleExportLibrary(library)}
                  >
                    导出
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteLibrary(library.id)}
                  >
                    <Delete />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>创建歌曲库</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="歌曲库名称"
              fullWidth
              value={newLibraryName}
              onChange={(e) => setNewLibraryName(e.target.value)}
              required
            />
            <TextField
              label="描述"
              fullWidth
              multiline
              rows={3}
              value={newLibraryDesc}
              onChange={(e) => setNewLibraryDesc(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleCreateLibrary}>创建</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
