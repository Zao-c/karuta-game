'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Person,
  Login as LoginIcon,
  PersonAdd,
} from '@mui/icons-material';
import { authService, AuthUser } from '../lib/authService';

type AuthPageProps = {
  onAuthSuccess: (user: AuthUser) => void;
  onSkip?: () => void;
};

export default function AuthPage({ onAuthSuccess, onSkip }: AuthPageProps) {
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('请填写邮箱和密码');
      return;
    }

    setLoading(true);
    setError('');

    const result = await authService.signIn(email, password);
    
    if (result.success) {
      const user = authService.getCurrentUser();
      if (user) {
        onAuthSuccess(user);
      }
    } else {
      setError(result.error || '登录失败');
    }
    
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!email || !password || !displayName) {
      setError('请填写所有字段');
      return;
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }

    setLoading(true);
    setError('');

    const result = await authService.signUp(email, password, displayName);
    
    if (result.success) {
      const user = authService.getCurrentUser();
      if (user) {
        onAuthSuccess(user);
      }
    } else {
      setError(result.error || '注册失败');
    }
    
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Paper
        sx={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
            p: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
            🎴 歌牌游戏
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
            登录以体验完整功能
          </Typography>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, newValue) => {
            setTab(newValue);
            setError('');
          }}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<LoginIcon />} label="登录" />
          <Tab icon={<PersonAdd />} label="注册" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {tab === 0 ? (
            <Box component="form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <TextField
                fullWidth
                label="邮箱"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="密码"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleLogin}
                disabled={loading}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : '登录'}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
              <TextField
                fullWidth
                label="昵称"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="邮箱"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="密码"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="至少6个字符"
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleRegister}
                disabled={loading}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #ff5a8d 0%, #b03a5a 100%)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : '注册'}
              </Button>
            </Box>
          )}

          {onSkip && (
            <Button
              fullWidth
              variant="text"
              onClick={onSkip}
              sx={{ mt: 2, color: '#888' }}
            >
              跳过，以游客身份继续
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
