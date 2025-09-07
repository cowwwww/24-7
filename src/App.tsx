import React, { useState } from 'react';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
  ThemeProvider,
  CssBaseline,
  createTheme,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Button,
  Badge,
} from '@mui/material';
import {
  Forum as ForumIcon,
  Star as ReviewIcon,
  People as ConnectionIcon,
  Storefront as MarketplaceIcon,
  Menu as MenuIcon,
  School as SchoolIcon,
  Login as LoginIcon,
  PersonAdd as SignupIcon,
  Notifications as NotificationsIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';

// Import components for each section
import ForumSection from './components/ForumSection';
import ReviewSection from './components/ReviewSection';
import ConnectionSection from './components/ConnectionSection';
import MarketplaceSection from './components/ResourceSection';

// Import auth components
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import Login from './components/Login';
import Signup from './components/Signup';
import UserProfile from './components/UserProfile';

// Create a monochrome theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#000000',
      light: '#333333',
      dark: '#000000',
    },
    secondary: {
      main: '#666666',
      light: '#999999',
      dark: '#333333',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#666666',
    },
    divider: '#e0e0e0',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          color: '#ffffff',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '0.875rem',
          fontWeight: 500,
          minWidth: 'auto',
          '@media (max-width:600px)': {
            fontSize: '0.75rem',
            minWidth: '80px',
            padding: '6px 8px',
          },
          '@media (min-width:600px)': {
            minWidth: '120px',
            padding: '12px 16px',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            paddingLeft: '8px',
            paddingRight: '8px',
          },
          '@media (min-width:600px)': {
            paddingLeft: '16px',
            paddingRight: '16px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`section-tabpanel-${index}`}
      aria-labelledby={`section-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `section-tab-${index}`,
    'aria-controls': `section-tabpanel-${index}`,
  };
}

function MainApp() {
  const [currentTab, setCurrentTab] = useState(0);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { currentUser } = useAuth();
  const { unreadCount } = useNotifications();

  // Listen for navigation from notifications
  React.useEffect(() => {
    const handleNavigateToPost = (event: CustomEvent) => {
      const { section, postId } = event.detail;
      
      // Switch to the correct tab
      const sectionMap: { [key: string]: number } = {
        'forum': 0,
        'reviews': 1,
        'connection': 2,
        'resources': 3
      };
      
      if (sectionMap[section] !== undefined) {
        setCurrentTab(sectionMap[section]);
        setHighlightedPostId(postId);
        
        // Clear highlight after a few seconds
        setTimeout(() => {
          setHighlightedPostId(null);
        }, 5000);
      }
    };

    window.addEventListener('navigateToPost', handleNavigateToPost as EventListener);
    return () => {
      window.removeEventListener('navigateToPost', handleNavigateToPost as EventListener);
    };
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setMobileMenuAnchor(null);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
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

  // Detect mobile devices
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 768 && window.innerHeight <= 1024);
  };

  // Simplified mobile fullscreen approach
  const toggleFullscreen = async () => {
    if (isMobile()) {
      if (!isFullscreen) {
        // Mobile fullscreen simulation
        try {
          // Try the standard fullscreen API first (works on some Android browsers)
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch (err) {
          console.log('Standard fullscreen not available on mobile, using fallback');
        }
        
        // Apply mobile-specific fullscreen styles
        document.body.classList.add('mobile-fullscreen');
        document.documentElement.classList.add('mobile-fullscreen');
        
        // Force body and html to fullscreen
        document.body.style.cssText = `
          height: 100vh !important;
          height: 100dvh !important;
          overflow: hidden !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
          z-index: 999999 !important;
        `;
        
        document.documentElement.style.cssText = `
          height: 100vh !important;
          height: 100dvh !important;
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
        `;
        
        // Multiple attempts to hide address bar
        const hideAddressBar = () => {
          window.scrollTo(0, 1);
          setTimeout(() => window.scrollTo(0, 0), 50);
        };
        
        hideAddressBar();
        setTimeout(hideAddressBar, 100);
        setTimeout(hideAddressBar, 300);
        setTimeout(hideAddressBar, 500);
        
        // Debug log
        console.log('Mobile fullscreen activated:', {
          userAgent: navigator.userAgent,
          screenHeight: screen.height,
          windowHeight: window.innerHeight,
          viewportHeight: window.visualViewport?.height
        });
        
        setIsFullscreen(true);
      } else {
        // Exit mobile fullscreen
        try {
          if (document.exitFullscreen && document.fullscreenElement) {
            await document.exitFullscreen();
          }
        } catch (err) {
          console.log('Exit fullscreen not available');
        }
        
        // Remove mobile fullscreen classes and reset styles
        document.body.classList.remove('mobile-fullscreen');
        document.documentElement.classList.remove('mobile-fullscreen');
        
        // Reset styles
        document.body.style.cssText = '';
        document.documentElement.style.cssText = '';
        
        console.log('Mobile fullscreen deactivated');
        
        setIsFullscreen(false);
      }
    } else {
      // Desktop fullscreen (unchanged)
      if (!document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        } catch (err) {
          console.error('Error attempting to enable fullscreen:', err);
        }
      } else {
        try {
          await document.exitFullscreen();
          setIsFullscreen(false);
        } catch (err) {
          console.error('Error attempting to exit fullscreen:', err);
        }
      }
    }
  };

  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      // Only update state for desktop fullscreen changes
      if (!isMobile()) {
        setIsFullscreen(!!document.fullscreenElement);
      }
    };

    const handleOrientationChange = () => {
      // Re-trigger address bar hiding on mobile orientation change
      if (isMobile() && isFullscreen) {
        setTimeout(() => {
          window.scrollTo(0, 1);
          setTimeout(() => {
            window.scrollTo(0, 0);
          }, 100);
        }, 300);
      }
    };

    // Desktop fullscreen event listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    // Mobile orientation change listener
    window.addEventListener('orientationchange', handleOrientationChange);
    screen.orientation?.addEventListener('change', handleOrientationChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      
      window.removeEventListener('orientationchange', handleOrientationChange);
      screen.orientation?.removeEventListener('change', handleOrientationChange);
    };
  }, [isFullscreen]);

  const sections = [
    { label: 'Forum', icon: <ForumIcon />, component: <ForumSection highlightedPostId={currentTab === 0 ? highlightedPostId : null} /> },
    { label: 'Reviews', icon: <ReviewIcon />, component: <ReviewSection /> },
    { label: 'Connect', icon: <ConnectionIcon />, component: <ConnectionSection /> },
    { label: 'Marketplace', icon: <MarketplaceIcon />, component: <MarketplaceSection highlightedPostId={currentTab === 3 ? highlightedPostId : null} /> },
  ];

  // Add mobile fullscreen CSS
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .mobile-fullscreen {
        height: 100vh !important;
        height: 100dvh !important; /* Dynamic viewport height for newer browsers */
        overflow: hidden !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        margin: 0 !important;
        padding: 0 !important;
        z-index: 999999 !important;
      }
      
      .mobile-fullscreen body {
        height: 100vh !important;
        height: 100dvh !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* iOS Safari specific fixes */
      @supports (-webkit-touch-callout: none) {
        .mobile-fullscreen {
          height: -webkit-fill-available !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      <Box 
        className={isFullscreen && isMobile() ? 'mobile-fullscreen-container' : ''}
        sx={{
          height: isFullscreen && isMobile() ? '100vh' : 'auto',
          overflow: isFullscreen && isMobile() ? 'hidden' : 'auto',
          overflowX: 'hidden', // Prevent horizontal scrolling
          ...(isFullscreen && isMobile() && {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999999,
            width: '100vw',
            height: 'calc(100vh)',
            minHeight: '100dvh', // For newer browsers with dynamic viewport
          })
        }}
      >
      
      {/* Mobile-First Navigation */}
      <AppBar position="static" sx={{ mb: 0 }}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1, sm: 2 } }}>
          <SchoolIcon sx={{ mr: { xs: 1, sm: 2 }, fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 600
            }}
          >
            24/7
          </Typography>

          {/* Fullscreen Button */}
          <IconButton
            onClick={toggleFullscreen}
            sx={{ 
              color: 'white',
              mr: 1,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>

          {/* Authentication Section */}
          {currentUser ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography 
                variant="body2" 
          sx={{ 
                  display: { xs: 'none', sm: 'block' }, 
                  color: 'rgba(255, 255, 255, 0.9)' 
                }}
              >
                Welcome, {getDisplayName()}
              </Typography>
              
              {/* Notification Bell */}
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{ color: 'white' }}
              >
                <Badge 
                  badgeContent={unreadCount} 
                  color="error"
                  max={99}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      height: '16px',
                      minWidth: '16px',
                    }
                  }}
                >
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
              
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{ p: 0 }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)', 
                    width: { xs: 32, sm: 36 }, 
                    height: { xs: 32, sm: 36 },
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  {getAvatarLetter()}
                </Avatar>
              </IconButton>
              </Box>
            ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                color="inherit"
                startIcon={<LoginIcon />}
                onClick={() => setLoginOpen(true)}
                            sx={{
                  display: { xs: 'none', sm: 'flex' },
                  fontSize: '0.875rem'
                }}
              >
                Login
                          </Button>
                          <Button 
                color="inherit"
                variant="outlined"
                startIcon={<SignupIcon />}
                onClick={() => setSignupOpen(true)}
                            sx={{
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1, sm: 2 }
                }}
              >
                Sign Up
                          </Button>
              {/* Mobile Login Button */}
              <IconButton
                color="inherit"
                onClick={() => setLoginOpen(true)}
                sx={{ display: { xs: 'flex', sm: 'none' } }}
              >
                <LoginIcon />
              </IconButton>
              </Box>
            )}
        </Toolbar>
      </AppBar>

      {/* Bottom Navigation for Mobile */}
      <Paper 
          sx={{ 
            position: 'fixed', 
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: { xs: 'block', md: 'none' },
          borderRadius: 0,
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: 'white'
        }}
      >
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minWidth: 'auto',
              fontSize: '0.7rem',
              minHeight: 64,
              py: 1,
            },
            '& .MuiTab-iconWrapper': {
              marginBottom: '2px',
            },
          }}
        >
          {sections.map((section, index) => (
            <Tab
              key={index}
              icon={section.icon}
              label={section.label.split(' ')[0]} // Use only first word for mobile
              iconPosition="top"
              {...a11yProps(index)}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Desktop Tabs */}
      <Paper 
              sx={{
          display: { xs: 'none', md: 'block' },
          borderRadius: 0,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Container maxWidth="xl">
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              '& .MuiTab-root': {
                minWidth: 'auto',
                fontSize: '0.875rem',
                fontWeight: 500,
              },
            }}
          >
            {sections.map((section, index) => (
              <Tab
                key={index}
                icon={section.icon}
                label={section.label}
                iconPosition="start"
                {...a11yProps(index)}
              />
            ))}
          </Tabs>
        </Container>
      </Paper>

      {/* Main Content */}
      <Container 
        maxWidth="xl" 
        sx={{ 
          mt: 0, 
          mb: { xs: 10, md: 4 }, // Extra bottom margin on mobile for bottom nav
          px: { xs: 1, sm: 2 },
          overflowX: 'hidden' // Prevent horizontal scrolling
        }}
      >
        {sections.map((section, index) => (
          <TabPanel key={index} value={currentTab} index={index}>
            {section.component}
          </TabPanel>
        ))}
      </Container>

      {/* Authentication Dialogs */}
      <Login
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSwitchToSignup={() => {
          setLoginOpen(false);
          setSignupOpen(true);
        }}
      />

      <Signup
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSwitchToLogin={() => {
          setSignupOpen(false);
          setLoginOpen(true);
        }}
      />

      {/* User Profile Menu */}
      <UserProfile
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
      />
      </Box>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;