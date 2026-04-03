'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Replay,
} from '@mui/icons-material';
import { Song } from '../lib/songLibraryService';

type AudioPlayerProps = {
  song: Song | null;
  autoPlay?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onPlayStart?: () => void;
  showProgress?: boolean;
  compact?: boolean;
};

export default function AudioPlayer({
  song,
  autoPlay = false,
  onEnded,
  onTimeUpdate,
  onPlayStart,
  showProgress = true,
  compact = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const sampleStart = song?.sampleStart || 0;
  const sampleDuration = song?.sampleDuration || 15;
  const sampleEnd = sampleStart + sampleDuration;

  useEffect(() => {
    if (song && audioRef.current) {
      setIsLoading(true);
      setHasStarted(false);
      setIsPlaying(false);
      setCurrentTime(sampleStart);
      audioRef.current.currentTime = sampleStart;
      
      if (autoPlay) {
        playSample();
      }
    }
  }, [song?.id]);

  const playSample = useCallback(() => {
    if (!audioRef.current || !song) return;
    
    audioRef.current.currentTime = sampleStart;
    audioRef.current.volume = isMuted ? 0 : volume;
    
    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
        setHasStarted(true);
        onPlayStart?.();
      })
      .catch((err) => {
        console.error('Failed to play audio:', err);
      });
  }, [song, sampleStart, volume, isMuted, onPlayStart]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('Failed to resume audio:', err);
        });
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else if (hasStarted) {
      resume();
    } else {
      playSample();
    }
  }, [isPlaying, hasStarted, pause, resume, playSample]);

  const replay = useCallback(() => {
    if (audioRef.current && song) {
      audioRef.current.currentTime = sampleStart;
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setHasStarted(true);
        })
        .catch((err) => {
          console.error('Failed to replay audio:', err);
        });
    }
  }, [song, sampleStart]);

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current || !song) return;
    
    const time = audioRef.current.currentTime;
    setCurrentTime(time);
    onTimeUpdate?.(time);
    
    if (time >= sampleEnd) {
      audioRef.current.pause();
      setIsPlaying(false);
      onEnded?.();
    }
  }, [song, sampleEnd, onEnded, onTimeUpdate]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  }, []);

  const handleVolumeChange = useCallback((_: Event, newValue: number | number[]) => {
    const newVolume = newValue as number;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? volume : 0;
      setIsMuted(!isMuted);
    }
  }, [isMuted, volume]);

  const progress = duration > 0 
    ? ((currentTime - sampleStart) / sampleDuration) * 100 
    : 0;
  const clampedProgress = Math.min(100, Math.max(0, progress));

  if (!song) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">请选择歌曲</Typography>
      </Paper>
    );
  }

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <audio
          ref={audioRef}
          src={song.audioFile || song.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={() => setIsLoading(false)}
        />
        
        {isLoading ? (
          <CircularProgress size={24} />
        ) : (
          <IconButton onClick={togglePlay} size="small">
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
        )}
        
        {showProgress && (
          <Box sx={{ flex: 1, minWidth: 100 }}>
            <Slider
              size="small"
              value={clampedProgress}
              min={0}
              max={100}
              disabled
              sx={{
                '& .MuiSlider-track': {
                  bgcolor: '#ff6b9d',
                },
              }}
            />
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Paper
      sx={{
        p: 3,
        background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)',
        borderRadius: 3,
      }}
    >
      <audio
        ref={audioRef}
        src={song.audioFile || song.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={() => setIsLoading(false)}
      />
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        {isLoading ? (
          <CircularProgress size={48} />
        ) : (
          <IconButton
            onClick={togglePlay}
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
              '&:hover': {
                bgcolor: '#ff6b9d',
              },
            }}
          >
            {isPlaying ? (
              <Pause sx={{ fontSize: 32, color: 'white' }} />
            ) : (
              <PlayArrow sx={{ fontSize: 32, color: 'white' }} />
            )}
          </IconButton>
        )}
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {isPlaying ? '正在播放...' : '点击播放试听'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Math.floor(currentTime - sampleStart)}秒 / {sampleDuration}秒
          </Typography>
        </Box>
        
        <IconButton onClick={replay} disabled={isLoading}>
          <Replay />
        </IconButton>
      </Box>
      
      {showProgress && (
        <Box sx={{ mb: 2 }}>
          <Slider
            value={clampedProgress}
            min={0}
            max={100}
            disabled
            sx={{
              '& .MuiSlider-track': {
                bgcolor: '#ff6b9d',
                border: 'none',
              },
              '& .MuiSlider-thumb': {
                display: 'none',
              },
              '& .MuiSlider-rail': {
                bgcolor: 'rgba(255,107,157,0.2)',
              },
            }}
          />
        </Box>
      )}
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={toggleMute} size="small">
          {isMuted ? <VolumeOff /> : <VolumeUp />}
        </IconButton>
        <Slider
          size="small"
          value={isMuted ? 0 : volume}
          min={0}
          max={1}
          step={0.01}
          onChange={handleVolumeChange}
          sx={{ width: 100 }}
        />
        <Typography variant="caption" color="text.secondary">
          {Math.round((isMuted ? 0 : volume) * 100)}%
        </Typography>
      </Box>
    </Paper>
  );
}
