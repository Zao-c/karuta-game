'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Stack,
  Grid,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Switch,
  Alert,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  EmojiEvents,
  Timer,
  MusicNote,
  CheckCircle,
  Cancel,
  Replay,
} from '@mui/icons-material';
import AudioPlayer from './AudioPlayer';
import { songLibraryService, Song, SongLibrary, GuessSongConfig } from '../lib/songLibraryService';

type GuessSongGameProps = {
  onBack: () => void;
};

type GameState = 'setup' | 'playing' | 'result' | 'ended';

type GameResult = {
  song: Song;
  isCorrect: boolean;
  selectedAnswer: string | null;
  reactionTime: number;
  points: number;
};

export default function GuessSongGame({ onBack }: GuessSongGameProps) {
  const [libraries, setLibraries] = useState<SongLibrary[]>([]);
  const [gameState, setGameState] = useState<GameState>('setup');
  const [config, setConfig] = useState<GuessSongConfig>({
    libraryId: '',
    rounds: 10,
    sampleDuration: 15,
    difficulty: 'all',
    showOptions: true,
    optionCount: 4,
    timeLimit: 30,
    playFullSong: true,
  });
  
  const [currentRound, setCurrentRound] = useState(0);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [options, setOptions] = useState<Song[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [roundStartTime, setRoundStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const allSongsRef = useRef<Song[]>([]);

  useEffect(() => {
    setLibraries(songLibraryService.getLibraries());
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && !showRoundResult) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [gameState, timeLeft, showRoundResult]);

  const startGame = useCallback(() => {
    const library = songLibraryService.getLibrary(config.libraryId);
    if (!library || library.songs.length === 0) {
      alert('请选择有效的歌曲库');
      return;
    }
    
    allSongsRef.current = library.songs;
    
    const gameSongs = songLibraryService.getRandomSongs(
      config.libraryId,
      config.rounds,
      config.difficulty === 'all' ? undefined : config.difficulty
    );
    
    if (gameSongs.length === 0) {
      alert('歌曲库中没有符合条件的歌曲');
      return;
    }
    
    setGameState('playing');
    setCurrentRound(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setResults([]);
    
    startRound(gameSongs[0], 0);
  }, [config]);

  const startRound = useCallback((song: Song, round: number) => {
    setCurrentSong(song);
    setCurrentRound(round + 1);
    setSelectedAnswer(null);
    setShowRoundResult(false);
    setTimeLeft(config.timeLimit);
    setRoundStartTime(Date.now());
    setReactionTime(0);
    
    const songOptions = songLibraryService.generateOptions(
      song,
      allSongsRef.current,
      config.optionCount
    );
    setOptions(songOptions);
  }, [config]);

  const handleAnswer = useCallback((songId: string) => {
    if (showRoundResult || !currentSong) return;
    
    const reactionMs = Date.now() - roundStartTime;
    setReactionTime(reactionMs / 1000);
    setSelectedAnswer(songId);
    
    const isCorrect = songId === currentSong.id;
    
    if (isCorrect) {
      const points = songLibraryService.calculatePoints(
        currentSong.difficulty,
        reactionMs / 1000,
        config.timeLimit
      );
      setScore(prev => prev + points);
      setCombo(prev => {
        const newCombo = prev + 1;
        setMaxCombo(max => Math.max(max, newCombo));
        return newCombo;
      });
    } else {
      setCombo(0);
    }
    
    setResults(prev => [...prev, {
      song: currentSong,
      isCorrect,
      selectedAnswer: songId,
      reactionTime: reactionMs / 1000,
      points: isCorrect ? songLibraryService.calculatePoints(currentSong.difficulty, reactionMs / 1000, config.timeLimit) : 0,
    }]);
    
    setShowRoundResult(true);
  }, [currentSong, showRoundResult, roundStartTime, config]);

  const handleTimeUp = useCallback(() => {
    if (!currentSong || showRoundResult) return;
    
    setResults(prev => [...prev, {
      song: currentSong,
      isCorrect: false,
      selectedAnswer: null,
      reactionTime: config.timeLimit,
      points: 0,
    }]);
    
    setCombo(0);
    setShowRoundResult(true);
  }, [currentSong, showRoundResult, config]);

  const nextRound = useCallback(() => {
    const gameSongs = songLibraryService.getRandomSongs(
      config.libraryId,
      config.rounds,
      config.difficulty === 'all' ? undefined : config.difficulty
    );
    
    if (currentRound >= config.rounds || currentRound >= gameSongs.length) {
      setGameState('ended');
    } else {
      startRound(gameSongs[currentRound], currentRound);
    }
  }, [currentRound, config, startRound]);

  const restartGame = useCallback(() => {
    setGameState('setup');
    setCurrentRound(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setResults([]);
  }, []);

  const renderSetup = () => (
    <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        🎵 猜歌模式设置
      </Typography>
      
      {libraries.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          还没有歌曲库，请先创建或导入歌曲库
        </Alert>
      ) : (
        <>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <Typography sx={{ mb: 1, fontWeight: 500 }}>选择歌曲库</Typography>
            <RadioGroup
              value={config.libraryId}
              onChange={(e) => setConfig(prev => ({ ...prev, libraryId: e.target.value }))}
            >
              {libraries.map(lib => (
                <FormControlLabel
                  key={lib.id}
                  value={lib.id}
                  control={<Radio />}
                  label={`${lib.name} (${lib.songs.length}首)`}
                />
              ))}
            </RadioGroup>
          </FormControl>
          
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ mb: 1, fontWeight: 500 }}>游戏轮数: {config.rounds}</Typography>
            <Slider
              value={config.rounds}
              min={5}
              max={20}
              step={1}
              onChange={(_, value) => setConfig(prev => ({ ...prev, rounds: value as number }))}
            />
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ mb: 1, fontWeight: 500 }}>试听时长: {config.sampleDuration}秒</Typography>
            <Slider
              value={config.sampleDuration}
              min={5}
              max={30}
              step={5}
              onChange={(_, value) => setConfig(prev => ({ ...prev, sampleDuration: value as number }))}
            />
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ mb: 1, fontWeight: 500 }}>答题时间: {config.timeLimit}秒</Typography>
            <Slider
              value={config.timeLimit}
              min={10}
              max={60}
              step={5}
              onChange={(_, value) => setConfig(prev => ({ ...prev, timeLimit: value as number }))}
            />
          </Box>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <Typography sx={{ mb: 1, fontWeight: 500 }}>难度</Typography>
            <RadioGroup
              value={config.difficulty}
              onChange={(e) => setConfig(prev => ({ ...prev, difficulty: e.target.value as any }))}
              row
            >
              <FormControlLabel value="all" control={<Radio />} label="全部" />
              <FormControlLabel value="easy" control={<Radio />} label="简单" />
              <FormControlLabel value="medium" control={<Radio />} label="中等" />
              <FormControlLabel value="hard" control={<Radio />} label="困难" />
            </RadioGroup>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch
                checked={config.showOptions}
                onChange={(e) => setConfig(prev => ({ ...prev, showOptions: e.target.checked }))}
              />
            }
            label="显示选项"
            sx={{ mb: 2 }}
          />
          
          {config.showOptions && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ mb: 1, fontWeight: 500 }}>选项数量: {config.optionCount}</Typography>
              <Slider
                value={config.optionCount}
                min={2}
                max={6}
                step={1}
                onChange={(_, value) => setConfig(prev => ({ ...prev, optionCount: value as number }))}
              />
            </Box>
          )}
        </>
      )}
      
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={onBack}>
          返回
        </Button>
        <Button
          variant="contained"
          onClick={startGame}
          disabled={!config.libraryId}
          sx={{
            background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
            },
          }}
        >
          开始游戏
        </Button>
      </Stack>
    </Paper>
  );

  const renderPlaying = () => (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            🎵 猜歌模式 - 第 {currentRound}/{config.rounds} 轮
          </Typography>
          <Stack direction="row" spacing={2}>
            <Chip icon={<EmojiEvents />} label={`${score}分`} color="primary" />
            {combo > 1 && <Chip icon={<MusicNote />} label={`${combo}连击`} color="secondary" />}
          </Stack>
        </Stack>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Timer color={timeLeft <= 5 ? 'error' : 'action'} />
          <Box sx={{ flex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={(timeLeft / config.timeLimit) * 100}
              color={timeLeft <= 5 ? 'error' : 'primary'}
            />
          </Box>
          <Typography color={timeLeft <= 5 ? 'error' : 'text.primary'}>
            {timeLeft}秒
          </Typography>
        </Stack>
        
        <AudioPlayer
          song={currentSong}
          autoPlay
          onEnded={() => {
            if (!selectedAnswer && !showRoundResult) {
              // 可以选择自动结束或继续等待
            }
          }}
        />
      </Paper>
      
      {!showRoundResult && (
        <Grid container spacing={2}>
          {options.map((option, index) => (
            <Grid item xs={12} sm={6} key={option.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '2px solid transparent',
                  '&:hover': {
                    borderColor: '#ff6b9d',
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => handleAnswer(option.id)}
              >
                <CardContent>
                  <Typography variant="h6">
                    {String.fromCharCode(65 + index)}. {option.anime}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.title} - {option.artist}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {showRoundResult && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            {selectedAnswer === currentSong?.id ? (
              <>
                <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" color="success.main">
                  正确！+{results[results.length - 1]?.points || 0}分
                </Typography>
              </>
            ) : (
              <>
                <Cancel sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                <Typography variant="h5" color="error.main">
                  {selectedAnswer ? '答错了' : '时间到'}
                </Typography>
              </>
            )}
          </Box>
          
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h6">
              🎵 {currentSong?.title} - {currentSong?.artist}
            </Typography>
            <Typography color="text.secondary">
              📺 {currentSong?.anime}
            </Typography>
            {reactionTime > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                反应时间: {reactionTime.toFixed(1)}秒
              </Typography>
            )}
          </Box>
          
          <Button
            variant="contained"
            fullWidth
            onClick={nextRound}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              },
            }}
          >
            {currentRound >= config.rounds ? '查看结果' : '下一题'}
          </Button>
        </Paper>
      )}
    </Box>
  );

  const renderEnded = () => {
    const correctCount = results.filter(r => r.isCorrect).length;
    const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
    
    return (
      <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <EmojiEvents sx={{ fontSize: 80, color: '#ffd700', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            游戏结束！
          </Typography>
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,107,157,0.1)' }}>
              <Typography variant="h3" color="primary">
                {score}
              </Typography>
              <Typography color="text.secondary">总分数</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(102,126,234,0.1)' }}>
              <Typography variant="h3" color="secondary">
                {accuracy}%
              </Typography>
              <Typography color="text.secondary">正确率</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4">{correctCount}/{results.length}</Typography>
              <Typography color="text.secondary">正确题数</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4">{maxCombo}</Typography>
              <Typography color="text.secondary">最大连击</Typography>
            </Paper>
          </Grid>
        </Grid>
        
        <Typography variant="h6" sx={{ mb: 2 }}>答题详情</Typography>
        <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 3 }}>
          {results.map((result, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1,
                mb: 1,
                borderRadius: 1,
                bgcolor: result.isCorrect ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)',
              }}
            >
              {result.isCorrect ? (
                <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
              ) : (
                <Cancel sx={{ color: 'error.main', mr: 1 }} />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">
                  {result.song.title} - {result.song.anime}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {result.points > 0 ? `+${result.points}` : '0'}分
              </Typography>
            </Box>
          ))}
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={onBack}>
            返回大厅
          </Button>
          <Button
            variant="contained"
            startIcon={<Replay />}
            onClick={restartGame}
            sx={{
              background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
              },
            }}
          >
            再玩一次
          </Button>
        </Stack>
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {gameState === 'setup' && renderSetup()}
      {gameState === 'playing' && renderPlaying()}
      {gameState === 'ended' && renderEnded()}
    </Box>
  );
}
