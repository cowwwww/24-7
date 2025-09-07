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
  FormControlLabel,
  Checkbox,
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

interface SignupProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ open, onClose, onSwitchToLogin }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { loginWithGoogle, signupWithEmailAndPassword } = useAuth();

  const handleGoogleSignup = async () => {
    if (!agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      setAgreeToTerms(false);
      onClose();
    } catch (error: any) {
      console.error('Google signup error:', error);
      setError(error.message || 'Failed to sign up with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signupWithEmailAndPassword(email, password);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAgreeToTerms(false);
      onClose();
    } catch (error: any) {
      console.error('Email signup error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create account';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
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
    setAgreeToTerms(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Join the Community! 🎓
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="body1" color="textSecondary">
            Create your account to get started
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Email/Password Form */}
        <Box component="form" onSubmit={handleEmailSignup} sx={{ mb: 3 }}>
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
          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                name="agreeToTerms"
                disabled={loading}
              />
            }
            label={
              <Typography variant="body2">
                I agree to the Terms of Service and Privacy Policy
              </Typography>
            }
            sx={{ mb: 2 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading || !email || !password || !confirmPassword || !agreeToTerms}
            sx={{ py: 1.5 }}
          >
            {loading ? <CircularProgress size={20} /> : 'Create Account'}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }}>
          <Typography variant="body2" color="textSecondary">
            OR
          </Typography>
        </Divider>

        {/* Google Sign-Up */}
        <Button
          fullWidth
          variant="outlined"
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleSignup}
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
            Already have an account?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={() => {
                handleClose();
                onSwitchToLogin();
              }}
              sx={{ color: '#000000', textDecoration: 'underline' }}
            >
              Sign In
            </Link>
          </Typography>
        </Box>

        <Box sx={{ mt: 3, p: 2, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center' }}>
            By signing up, you'll be able to participate in forum discussions, 
            leave reviews, connect with other students, and access exclusive resources.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default Signup;