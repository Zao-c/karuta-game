'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import {
  Cloud,
  Computer,
  CheckCircle,
  Error,
  Refresh,
} from '@mui/icons-material';

type SupabaseSetupProps = {
  onConfigured?: () => void;
  onSkip?: () => void;
};

export default function SupabaseSetup({ onConfigured, onSkip }: SupabaseSetupProps) {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const savedUrl = localStorage.getItem('supabase_url');
    const savedKey = localStorage.getItem('supabase_anon_key');
    if (savedUrl) setSupabaseUrl(savedUrl);
    if (savedKey) setSupabaseKey(savedKey);
  }, []);

  const testConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setTestResult('error');
      setErrorMessage('请填写 Supabase URL 和 Anon Key');
      return;
    }

    setTesting(true);
    setTestResult(null);
    setErrorMessage('');

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const client = createClient(supabaseUrl, supabaseKey);
      
      const { error } = await client.from('users').select('id').limit(1);
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      localStorage.setItem('supabase_url', supabaseUrl);
      localStorage.setItem('supabase_anon_key', supabaseKey);
      
      setTestResult('success');
      
      if (onConfigured) {
        setTimeout(onConfigured, 1000);
      }
    } catch (err: any) {
      setTestResult('error');
      setErrorMessage(err.message || '连接失败，请检查配置');
    } finally {
      setTesting(false);
    }
  };

  const handleSkip = () => {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_anon_key');
    if (onSkip) onSkip();
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
          maxWidth: 500,
          borderRadius: 4,
          p: 4,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Cloud sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            多人联机设置
          </Typography>
          <Typography sx={{ color: '#666' }}>
            配置 Supabase 以启用真正的多人联机功能
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>如何获取 Supabase 配置：</strong><br />
            1. 访问 <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a> 创建免费项目<br />
            2. 在项目设置 → API 中找到 URL 和 anon key<br />
            3. 在 SQL Editor 中运行 supabase/schema.sql 创建数据表
          </Typography>
        </Alert>

        <Stack spacing={3}>
          <TextField
            fullWidth
            label="Supabase URL"
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
            placeholder="https://xxxxx.supabase.co"
            helperText="在项目设置 → API 中找到"
          />

          <TextField
            fullWidth
            label="Supabase Anon Key"
            value={supabaseKey}
            onChange={(e) => setSupabaseKey(e.target.value)}
            type="password"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            helperText="公开的 anon key，可以安全使用"
          />

          {testResult === 'success' && (
            <Alert severity="success" icon={<CheckCircle />}>
              连接成功！正在保存配置...
            </Alert>
          )}

          {testResult === 'error' && (
            <Alert severity="error" icon={<Error />}>
              {errorMessage}
            </Alert>
          )}

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={testConnection}
            disabled={testing}
            startIcon={testing ? <CircularProgress size={20} /> : <Refresh />}
            sx={{
              py: 1.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {testing ? '测试连接中...' : '测试连接并保存'}
          </Button>

          <Divider>
            <Chip label="或者" />
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={handleSkip}
            startIcon={<Computer />}
            sx={{
              py: 1.5,
              borderColor: '#888',
              color: '#666',
              '&:hover': {
                borderColor: '#666',
                bgcolor: 'rgba(0,0,0,0.05)',
              },
            }}
          >
            使用本地模式（仅限同一浏览器）
          </Button>

          <Typography variant="body2" sx={{ color: '#888', textAlign: 'center' }}>
            本地模式使用 localStorage 和 BroadcastChannel<br />
            仅支持同一浏览器的不同标签页间通信
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
