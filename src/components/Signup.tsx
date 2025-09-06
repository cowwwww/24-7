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
} from '@mui/material';
import {
  Google as GoogleIcon,
  Apple as AppleIcon,
  Close as CloseIcon,
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

  const { loginWithGoogle, loginWithApple } = useAuth();

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

  const handleAppleSignup = async () => {
    if (!agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await loginWithApple();
      setAgreeToTerms(false);
      onClose();
    } catch (error: any) {
      console.error('Apple signup error:', error);
      setError(error.message || 'Failed to sign up with Apple');
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
        <Typography variant="h6">
          Join the Community! 🎓
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="body1" color="textSecondary">
            Sign up with your social account to get started
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <FormControlLabel
          control={
            <Checkbox
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              name="agreeToTerms"
            />
          }
          label={
            <Typography variant="body2">
              I agree to the Terms of Service and Privacy Policy
            </Typography>
          }
          sx={{ mb: 3 }}
        />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<AppleIcon />}
            onClick={handleAppleSignup}
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