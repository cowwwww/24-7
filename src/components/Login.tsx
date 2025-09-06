import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Box,
  IconButton,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Apple as AppleIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  open: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ open, onClose, onSwitchToSignup }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginWithGoogle, loginWithApple } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      onClose();
    } catch (error: any) {
      console.error('Google login error:', error);
      setError(error.message || 'Failed to log in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithApple();
      onClose();
    } catch (error: any) {
      console.error('Apple login error:', error);
      setError(error.message || 'Failed to log in with Apple');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Welcome Back! 👋
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="body1" color="textSecondary">
            Sign in to access your account and continue your journey
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            disabled={loading}
            sx={{ 
              py: 1.5,
              borderColor: '#db4437',
              color: '#db4437',
              '&:hover': {
                borderColor: '#c23321',
                backgroundColor: '#fdf2f2'
              }
            }}
          >
            {loading ? <CircularProgress size={20} /> : 'Continue with Google'}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<AppleIcon />}
            onClick={handleAppleLogin}
            disabled={loading}
            sx={{ 
              py: 1.5,
              borderColor: '#000000',
              color: '#000000',
              '&:hover': {
                borderColor: '#333333',
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            {loading ? <CircularProgress size={20} /> : 'Continue with Apple'}
          </Button>
        </Box>

        <Box textAlign="center" sx={{ mt: 3 }}>
          <Typography variant="body2" color="textSecondary">
            Don't have an account?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={() => {
                handleClose();
                onSwitchToSignup();
              }}
              sx={{ color: '#000000', textDecoration: 'underline' }}
            >
              Sign Up
            </Link>
          </Typography>
        </Box>

        <Box sx={{ mt: 3, p: 2, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center' }}>
            Secure authentication powered by Google and Apple. 
            Your data is protected and we never store your passwords.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default Login;