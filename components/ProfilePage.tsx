'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  Divider,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Grid,
  Tooltip,
  Alert,
  Snackbar,
  LinearProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  PhotoCamera,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Favorite as FavoriteIcon,
  EmojiEvents as EmojiEventsIcon,
  SportsEsports as SportsEsportsIcon,
  Upload,
  Download,
} from '@mui/icons-material';
import { userProfileService, UserProfile, UserDeck } from '../lib/userProfileService';
import { globalDeckService, GlobalDeck } from '../lib/globalDeckService';
import { storageService } from '../lib/storageService';

type ProfilePageProps = {
  onBack: () => void;
  onUseDeck?: (deck: UserDeck) => void;
  onProfileUpdate?: (profile: UserProfile) => void;
};

const AVATAR_COLORS = [
  '#ff6b9d', '#ff9f43', '#feca57', '#48dbfb', '#1dd1a1',
  '#5f27cd', '#ee5a24', '#009432', '#0652DD', '#833471',
];

const DEFAULT_AVATARS = AVATAR_COLORS.map((color, index) => ({
  id: `default_${index}`,
  url: '',
  color,
  emoji: ['🎮', '🎯', '🎪', '🎨', '🎭', '🎪', '🎸', '🎺', '🎻', '🎹'][index],
}));

export default function ProfilePage({ onBack, onUseDeck, onProfileUpdate }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userDecks, setUserDecks] = useState<UserDeck[]>([]);
  const [globalDecks, setGlobalDecks] = useState<GlobalDeck[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [deckDialogOpen, setDeckDialogOpen] = useState(false);
  const [formatDialogOpen, setFormatDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deckFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfile(userProfileService.getProfile());
    setUserDecks(userProfileService.getDecks());
    setGlobalDecks(globalDeckService.getDecks());
    void userProfileService.syncWithCloud()
      .then(({ profile: syncedProfile, decks }) => {
        setProfile(syncedProfile);
        setUserDecks(decks);
      })
      .catch((error) => console.error('Failed to sync user profile:', error));
    void globalDeckService.syncWithCloud()
      .then((decks) => setGlobalDecks(decks))
      .catch((error) => console.error('Failed to sync global decks:', error));
  }, []);

  const handleEditProfile = useCallback(() => {
    if (!profile) return;
    setEditName(profile.displayName);
    setEditBio(profile.bio);
    setEditDialogOpen(true);
  }, [profile]);

  const handleSaveProfile = useCallback(async () => {
    if (!editName.trim()) {
      setSnackbar({ open: true, message: '昵称不能为空', severity: 'error' });
      return;
    }
    try {
      const updated = await userProfileService.updateProfileAsync({
        displayName: editName.trim(),
        bio: editBio.trim(),
      });
      setProfile(updated);
      setEditDialogOpen(false);
      setSnackbar({ open: true, message: '个人资料已更新', severity: 'success' });
      onProfileUpdate?.(updated);
    } catch (error) {
      setSnackbar({ open: true, message: `个人资料更新失败: ${error instanceof Error ? error.message : '请稍后重试'}`, severity: 'error' });
    }
  }, [editName, editBio, onProfileUpdate]);

  const handleAvatarUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setSnackbar({ open: true, message: '图片大小不能超过2MB', severity: 'error' });
      return;
    }

    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const maxSize = 128;
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      const compressedData = canvas.toDataURL('image/jpeg', 0.7);
      
      if (compressedData.length > 500 * 1024) {
        setSnackbar({ open: true, message: '图片压缩后仍然过大，请选择更小的图片', severity: 'error' });
        return;
      }
      
      try {
        const updated = userProfileService.updateAvatar(compressedData);
        setProfile(updated);
        setAvatarDialogOpen(false);
        setSnackbar({ open: true, message: '头像已更新', severity: 'success' });
        onProfileUpdate?.(updated);
      } catch (error) {
        setSnackbar({ open: true, message: '头像保存失败，请尝试更小的图片', severity: 'error' });
      }
    };
    
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [onProfileUpdate]);

  const handleSelectDefaultAvatar = useCallback(async (avatar: typeof DEFAULT_AVATARS[0]) => {
    const avatarData = `emoji:${avatar.emoji}:${avatar.color}`;
    try {
      const updated = await userProfileService.updateAvatarAsync(avatarData);
      setProfile(updated);
      setAvatarDialogOpen(false);
      setSnackbar({ open: true, message: '头像已更新', severity: 'success' });
      onProfileUpdate?.(updated);
    } catch (error) {
      setSnackbar({ open: true, message: `头像更新失败: ${error instanceof Error ? error.message : '请稍后重试'}`, severity: 'error' });
    }
  }, [onProfileUpdate]);

  const handleAvatarUploadCloud = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setSnackbar({ open: true, message: '图片大小不能超过 2MB', severity: 'error' });
      return;
    }

    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const maxSize = 128;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressedBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.7);
        });

        if (!compressedBlob) {
          setSnackbar({ open: true, message: '头像压缩失败，请重试', severity: 'error' });
          return;
        }

        if (compressedBlob.size > 500 * 1024) {
          setSnackbar({ open: true, message: '压缩后的头像仍然过大，请换一张更小的图片', severity: 'error' });
          return;
        }

        const uploadResult = await storageService.uploadPublicFile({
          bucket: 'avatars',
          file: compressedBlob,
          fileName: file.name.replace(/\.[^.]+$/, '') + '.jpg',
          folder: profile?.id || 'anonymous',
          contentType: 'image/jpeg',
        });

        const updated = await userProfileService.updateAvatarAsync(uploadResult.publicUrl);
        setProfile(updated);
        setAvatarDialogOpen(false);
        setSnackbar({ open: true, message: '头像已上传到云端并更新', severity: 'success' });
        onProfileUpdate?.(updated);
      } catch (error) {
        setSnackbar({
          open: true,
          message: `头像上传失败: ${error instanceof Error ? error.message : '请稍后重试'}`,
          severity: 'error',
        });
      }
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [onProfileUpdate, profile?.id]);

  const handleRegenerateId = useCallback(async () => {
    if (confirm('确定要重新生成ID吗？旧ID将无法恢复。')) {
      try {
        const updated = await userProfileService.regenerateIdAsync();
        setProfile(updated);
        setSnackbar({ open: true, message: 'ID已重新生成', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: `ID重新生成失败: ${error instanceof Error ? error.message : '请稍后重试'}`, severity: 'error' });
      }
    }
  }, []);

  const handleDeleteDeck = useCallback(async (deckId: string) => {
    if (confirm('确定要删除这个歌牌组吗？')) {
      try {
        await userProfileService.deleteDeckAsync(deckId);
        setUserDecks(userProfileService.getDecks());
        setSnackbar({ open: true, message: '歌牌组已删除', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: `歌牌组删除失败: ${error instanceof Error ? error.message : '请稍后重试'}`, severity: 'error' });
      }
    }
  }, []);

  const handleDeckFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setSnackbar({ open: true, message: '请上传JSON格式的歌牌组文件', severity: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const deckData = JSON.parse(content);
        
        if (!deckData.name || !Array.isArray(deckData.cards)) {
          setSnackbar({ open: true, message: '歌牌组格式错误：需要name和cards字段', severity: 'error' });
          return;
        }

        if (deckData.cards.length === 0) {
          setSnackbar({ open: true, message: '歌牌组不能为空', severity: 'error' });
          return;
        }

        for (let i = 0; i < deckData.cards.length; i++) {
          const card = deckData.cards[i];
          if (!card.name || !card.anime) {
            setSnackbar({ open: true, message: `第${i + 1}张歌牌缺少name或anime字段`, severity: 'error' });
            return;
          }
        }

        void userProfileService.saveDeckAsync({
          name: deckData.name,
          description: deckData.description || '',
          cards: deckData.cards.map((card: any, index: number) => ({
            id: card.id || `card_${Date.now()}_${index}`,
            name: card.name,
            anime: card.anime,
            coverImage: card.coverImage || '',
            quotes: card.quotes || ['这是来自《' + card.anime + '》的经典台词！'],
            color: card.color || '#ff6b9d',
          })),
          isPublic: deckData.isPublic || false,
        }).then((newDeck) => {
          setUserDecks(userProfileService.getDecks());
          setSnackbar({ open: true, message: `成功导入歌牌组「${newDeck.name}」，共${newDeck.cards.length}张歌牌`, severity: 'success' });
        }).catch((error) => {
          setSnackbar({ open: true, message: `歌牌组导入失败: ${error instanceof Error ? error.message : '请稍后重试'}`, severity: 'error' });
        });
      } catch (error) {
        console.error('解析JSON失败:', error);
        setSnackbar({ open: true, message: 'JSON文件解析失败，请检查格式', severity: 'error' });
      }
    };
    reader.readAsText(file);
    
    if (deckFileInputRef.current) {
      deckFileInputRef.current.value = '';
    }
  }, []);

  const handleExportDeck = useCallback((deck: UserDeck) => {
    const exportData = {
      name: deck.name,
      description: deck.description,
      cards: deck.cards,
      isPublic: deck.isPublic,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setSnackbar({ open: true, message: '歌牌组导出成功', severity: 'success' });
  }, []);

  const handleToggleDeckVisibility = useCallback(async (deckId: string, isPublic: boolean) => {
    try {
      await userProfileService.updateDeckAsync(deckId, { isPublic: !isPublic });
      setUserDecks(userProfileService.getDecks());
      setSnackbar({ open: true, message: isPublic ? '歌牌组已设为私密' : '歌牌组已设为公开', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: `歌牌组更新失败: ${error instanceof Error ? error.message : '请稍后重试'}`, severity: 'error' });
    }
  }, []);

  const handleUseDeck = useCallback((deck: UserDeck) => {
    if (onUseDeck) {
      onUseDeck(deck);
      void userProfileService.incrementDeckPlayCountAsync(deck.id);
    }
  }, [onUseDeck]);

  const renderAvatar = (avatar: string, size: number = 80) => {
    if (!avatar) {
      return (
        <Avatar sx={{ width: size, height: size, bgcolor: '#ff6b9d', fontSize: size * 0.4 }}>
          🎮
        </Avatar>
      );
    }
    
    if (avatar.startsWith('emoji:')) {
      const [, emoji, color] = avatar.split(':');
      return (
        <Avatar sx={{ width: size, height: size, bgcolor: color, fontSize: size * 0.4 }}>
          {emoji}
        </Avatar>
      );
    }
    
    return (
      <Avatar 
        src={avatar} 
        sx={{ width: size, height: size }}
      />
    );
  };

  const winRate = profile?.stats.gamesPlayed 
    ? Math.round((profile.stats.gamesWon / profile.stats.gamesPlayed) * 100) 
    : 0;

  if (!profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      p: 3,
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Button
          onClick={onBack}
          sx={{ 
            mb: 3, 
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
          }}
        >
          ← 返回大厅
        </Button>

        <Paper 
          elevation={3}
          sx={{ 
            borderRadius: 4, 
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.95)',
          }}
        >
          <Box sx={{ 
            background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
            p: 4,
            position: 'relative',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ position: 'relative' }}>
                {renderAvatar(profile.avatar, 100)}
                <IconButton
                  onClick={() => setAvatarDialogOpen(true)}
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'white',
                    boxShadow: 2,
                    '&:hover': { bgcolor: '#f5f5f5' },
                  }}
                  size="small"
                >
                  <PhotoCamera fontSize="small" />
                </IconButton>
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                    {profile.displayName}
                  </Typography>
                  <IconButton 
                    onClick={handleEditProfile}
                    sx={{ color: 'white' }}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <Chip 
                    label={`ID: ${profile.id}`}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                  <Tooltip title="重新生成ID">
                    <IconButton 
                      onClick={handleRegenerateId}
                      sx={{ color: 'white' }}
                      size="small"
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                {profile.bio && (
                  <Typography sx={{ mt: 1, color: 'rgba(255,255,255,0.9)' }}>
                    {profile.bio}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    bgcolor: '#f8f9fa',
                    height: '100%',
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
                    📊 游戏统计
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SportsEsportsIcon sx={{ color: '#667eea' }} />
                        <Typography>游戏场次</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 600 }}>{profile.stats.gamesPlayed}</Typography>
                    </Box>
                    
                    <Divider />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmojiEventsIcon sx={{ color: '#ffd700' }} />
                        <Typography>胜利场次</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 600 }}>{profile.stats.gamesWon}</Typography>
                    </Box>
                    
                    <Divider />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography>胜率</Typography>
                      <Chip 
                        label={`${winRate}%`}
                        size="small"
                        sx={{ 
                          bgcolor: winRate >= 50 ? '#e8f5e9' : '#ffebee',
                          color: winRate >= 50 ? '#2e7d32' : '#c62828',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                    
                    <Divider />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography>总积分</Typography>
                      <Typography sx={{ fontWeight: 600, color: '#ff6b9d' }}>
                        {profile.stats.totalScore}
                      </Typography>
                    </Box>
                    
                    <Divider />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography>收集歌牌</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{profile.stats.totalCards}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    bgcolor: '#f8f9fa',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                      🎴 我的歌牌组 ({userDecks.length})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <input
                        type="file"
                        ref={deckFileInputRef}
                        accept=".json"
                        style={{ display: 'none' }}
                        onChange={handleDeckFileUpload}
                      />
                      <Button
                        variant="outlined"
                        startIcon={<Upload />}
                        onClick={() => deckFileInputRef.current?.click()}
                        sx={{
                          borderRadius: 2,
                          borderColor: '#c77dff',
                          color: '#c77dff',
                          '&:hover': {
                            borderColor: '#ff6b9d',
                            color: '#ff6b9d',
                          },
                        }}
                      >
                        导入歌牌组
                      </Button>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => setFormatDialogOpen(true)}
                        sx={{ color: '#888', fontSize: '0.75rem' }}
                      >
                        格式说明
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setDeckDialogOpen(true)}
                        sx={{
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
                          },
                        }}
                      >
                        创建歌牌组
                      </Button>
                    </Box>
                  </Box>
                  
                  {userDecks.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        还没有创建歌牌组，点击上方按钮创建你的第一个歌牌组！
                      </Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {userDecks.map((deck) => (
                        <Grid item xs={12} sm={6} key={deck.id}>
                          <Card 
                            sx={{ 
                              borderRadius: 3,
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 4,
                              },
                            }}
                          >
                            <Box sx={{ 
                              height: 80, 
                              background: `linear-gradient(135deg, ${deck.cards[0]?.color || '#667eea'} 0%, #764ba2 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <Typography variant="h3">
                                {deck.cards[0]?.coverImage ? '🎴' : '🎴'}
                              </Typography>
                            </Box>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {deck.name}
                                </Typography>
                                <Chip 
                                  icon={deck.isPublic ? <PublicIcon /> : <LockIcon />}
                                  label={deck.isPublic ? '公开' : '私密'}
                                  size="small"
                                  onClick={() => handleToggleDeckVisibility(deck.id, deck.isPublic)}
                                  sx={{ cursor: 'pointer' }}
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {deck.cards.length} 张歌牌 · 游玩 {deck.playCount} 次
                              </Typography>
                              {deck.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  {deck.description}
                                </Typography>
                              )}
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                              <Button 
                                size="small" 
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleDeleteDeck(deck.id)}
                              >
                                删除
                              </Button>
                              <Button 
                                size="small"
                                startIcon={<Download />}
                                onClick={() => handleExportDeck(deck)}
                                sx={{ color: '#667eea' }}
                              >
                                导出
                              </Button>
                              <Button 
                                size="small"
                                startIcon={<PlayArrowIcon />}
                                onClick={() => handleUseDeck(deck)}
                                sx={{
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  },
                                }}
                              >
                                使用
                              </Button>
                            </CardActions>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Paper>
              </Grid>
            </Grid>
            
            {profile.favoriteAnime.length > 0 && (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 3, 
                  bgcolor: '#f8f9fa',
                  mt: 3,
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
                  <FavoriteIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#ff6b9d' }} />
                  最爱的动画
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {profile.favoriteAnime.map((anime) => (
                    <Chip 
                      key={anime}
                      label={anime}
                      onDelete={() => {
                        const updated = userProfileService.removeFavoriteAnime(anime);
                        setProfile(updated);
                      }}
                      sx={{ 
                        borderRadius: 2,
                        bgcolor: 'white',
                        border: '1px solid #ff6b9d',
                      }}
                    />
                  ))}
                </Stack>
              </Paper>
            )}
          </Box>
        </Paper>
      </Box>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>编辑个人资料</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="昵称"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="个人简介"
            fullWidth
            multiline
            rows={3}
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button onClick={handleSaveProfile} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={avatarDialogOpen} onClose={() => setAvatarDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>设置头像</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>选择默认头像</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {DEFAULT_AVATARS.map((avatar) => (
              <Grid item key={avatar.id}>
                <Paper
                  onClick={() => handleSelectDefaultAvatar(avatar)}
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: avatar.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.1)' },
                  }}
                >
                  {avatar.emoji}
                </Paper>
              </Grid>
            ))}
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" sx={{ mb: 2 }}>上传自定义头像</Typography>
          <Button
            variant="outlined"
            component="label"
            startIcon={<PhotoCamera />}
            fullWidth
          >
            选择图片
            <input
              type="file"
              hidden
              accept="image/*"
              ref={fileInputRef}
              onChange={handleAvatarUploadCloud}
            />
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            支持 JPG、PNG 格式，大小不超过 2MB
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvatarDialogOpen(false)}>取消</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deckDialogOpen} onClose={() => setDeckDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>创建歌牌组</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            创建歌牌组功能将在游戏房间中完成。请先返回大厅，创建房间后添加自定义歌牌，然后保存为歌牌组。
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeckDialogOpen(false)}>知道了</Button>
          <Button 
            onClick={() => {
              setDeckDialogOpen(false);
              onBack();
            }} 
            variant="contained"
          >
            去创建
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={formatDialogOpen}
        onClose={() => setFormatDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>歌牌组JSON格式说明</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            请按照以下JSON格式创建歌牌组文件：
          </Typography>
          <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, overflow: 'auto' }}>
            <pre style={{ fontSize: '0.75rem', margin: 0, whiteSpace: 'pre-wrap' }}>
{`{
  "name": "我的歌牌组",
  "description": "歌牌组描述（可选）",
  "isPublic": false,
  "cards": [
    {
      "name": "芙莉莲",
      "anime": "葬送的芙莉莲",
      "coverImage": "https://example.com/image.jpg",
      "quotes": ["台词1", "台词2"],
      "color": "#5dc9f1"
    },
    {
      "name": "角色名",
      "anime": "动画名称",
      "coverImage": "封面图片URL（可选）",
      "quotes": ["经典台词数组"],
      "color": "#颜色代码（可选）"
    }
  ]
}`}
            </pre>
          </Paper>
          <Typography variant="body2" sx={{ mt: 2, color: '#666' }}>
            <strong>必填字段：</strong>name（歌牌组名称）、cards（歌牌数组）<br/>
            <strong>每张歌牌必填：</strong>name（角色名）、anime（动画名称）<br/>
            <strong>可选字段：</strong>coverImage、quotes、color
          </Typography>
          <Button
            variant="outlined"
            size="small"
            sx={{ mt: 2 }}
            onClick={() => {
              const template = {
                name: "示例歌牌组",
                description: "这是一个示例歌牌组",
                cards: [
                  { name: "示例角色", anime: "示例动画", quotes: ["示例台词"] }
                ]
              };
              const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'deck_template.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            下载模板文件
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormatDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
