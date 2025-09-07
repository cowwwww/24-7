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
  TextField,
  Divider,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Lock as LockIcon,
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { loginWithGoogle, loginWithEmailAndPassword } = useAuth();

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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await loginWithEmailAndPassword(email, password);
      onClose();
    } catch (error: any) {
      console.error('Email login error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to log in';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
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
        Welcome Back! 👋
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

        {/* Email/Password Form */}
        <Box component="form" onSubmit={handleEmailLogin} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading || !email || !password}
            sx={{ py: 1.5 }}
          >
            {loading ? <CircularProgress size={20} /> : 'Sign In'}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }}>
          <Typography variant="body2" color="textSecondary">
            OR
          </Typography>
        </Divider>

        {/* Google Sign-In */}
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