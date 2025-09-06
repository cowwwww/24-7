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
} from '@mui/material';
import {
  Forum as ForumIcon,
  Star as ReviewIcon,
  People as ConnectionIcon,
  Link as ResourceIcon,
  Menu as MenuIcon,
  School as SchoolIcon,
  Login as LoginIcon,
  PersonAdd as SignupIcon,
} from '@mui/icons-material';

// Import components for each section
import ForumSection from './components/ForumSection';
import ReviewSection from './components/ReviewSection';
import ConnectionSection from './components/ConnectionSection';
import ResourceSection from './components/ResourceSection';

// Import auth components
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
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
        <Box sx={{ p: 3 }}>
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

  const { currentUser } = useAuth();

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

  const sections = [
    { label: 'Forum', icon: <ForumIcon />, component: <ForumSection highlightedPostId={currentTab === 0 ? highlightedPostId : null} /> },
    { label: 'Reviews', icon: <ReviewIcon />, component: <ReviewSection highlightedPostId={currentTab === 1 ? highlightedPostId : null} /> },
    { label: 'Connect', icon: <ConnectionIcon />, component: <ConnectionSection highlightedPostId={currentTab === 2 ? highlightedPostId : null} /> },
    { label: 'Resources', icon: <ResourceIcon />, component: <ResourceSection highlightedPostId={currentTab === 3 ? highlightedPostId : null} /> },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
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
            24/7 Student
          </Typography>

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
          px: { xs: 1, sm: 2 } 
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