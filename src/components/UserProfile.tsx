import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Divider,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Badge,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ anchorEl, open, onClose }) => {
  const { currentUser, logout, updateUserProfile } = useAuth();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [notificationsDialogOpen, setNotificationsDialogOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setLogoutDialogOpen(false);
      onClose();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleUpdateDisplayName = async () => {
    if (!newDisplayName.trim()) return;

    try {
      setUpdateLoading(true);
      await updateUserProfile(newDisplayName.trim());
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
        setSettingsDialogOpen(false);
        setNewDisplayName('');
      }, 2000);
    } catch (error) {
      console.error('Failed to update display name:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  const openSettings = () => {
    setNewDisplayName(getDisplayName());
    setSettingsDialogOpen(true);
    onClose();
  };

  const openNotifications = () => {
    setNotificationsDialogOpen(true);
    onClose();
  };

  const getDisplayName = () => {
    if (currentUser?.displayName) {
      return currentUser.displayName;
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0];
    }
    return 'Student';
  };

  const getAvatarLetter = () => {
    const displayName = getDisplayName();
    return displayName.charAt(0).toUpperCase();
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 200,
            '& .MuiMenuItem-root': {
              py: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            {getAvatarLetter()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {getDisplayName()}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {currentUser?.email}
            </Typography>
          </Box>
        </Box>

        <Divider />

        <MenuItem onClick={openNotifications}>
          <ListItemIcon>
            <Badge badgeContent={3} color="error">
              <NotificationsIcon fontSize="small" />
            </Badge>
          </ListItemIcon>
          Notifications
        </MenuItem>

        <MenuItem onClick={openSettings}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>

        <Divider />

        <MenuItem 
          onClick={() => {
            onClose();
            setLogoutDialogOpen(true);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          Sign Out
        </MenuItem>
      </Menu>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Sign Out</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to sign out of your account?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleLogout} color="error" variant="contained">
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon />
          Account Settings
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {updateSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Display name updated successfully!
              </Alert>
            )}
            
            <TextField
              label="Display Name"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              fullWidth
              margin="normal"
              helperText="This is how other users will see your name"
            />
            
            <TextField
              label="Email"
              value={currentUser?.email || ''}
              fullWidth
              margin="normal"
              disabled
              helperText="Email cannot be changed"
            />
            
            <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Account Information
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Account created: {currentUser?.metadata?.creationTime ? 
                  new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'Unknown'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Last sign in: {currentUser?.metadata?.lastSignInTime ? 
                  new Date(currentUser.metadata.lastSignInTime).toLocaleDateString() : 'Unknown'}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateDisplayName} 
            variant="contained"
            disabled={updateLoading || !newDisplayName.trim()}
          >
            {updateLoading ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog
        open={notificationsDialogOpen}
        onClose={() => setNotificationsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon />
          Notifications
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            
            {/* Mock notifications - these would come from a real notification system */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  Someone liked your forum post
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  "How to improve study efficiency?" • 2 hours ago
                </Typography>
              </Box>
              
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  New reply to your question
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  "Best places to study on campus" • 1 day ago
                </Typography>
              </Box>
              
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  Your review was helpful
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Library review got 5 helpful votes • 2 days ago
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="body2" color="textSecondary" sx={{ mt: 3, textAlign: 'center' }}>
              Stay tuned! We're building a comprehensive notification system.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotificationsDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserProfile;
