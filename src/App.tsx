import { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Card,
  CardContent,
  Typography,
  Rating,
  Button,
  Box,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Divider,
  Paper,
  ThemeProvider,
  CssBaseline,
  Alert,
  CircularProgress,
  createTheme,
  AppBar,
  Toolbar,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  IconButton
} from '@mui/material';
import { Search, School, Person, Star, Add, Visibility, FilterList, Close, CheckCircle } from '@mui/icons-material';
import { addRating, getRatingsByProfessor, hasUserRatedProfessor } from './services/ratingService';
import { getProfessors } from './services/professorService';
import type { Rating as FirebaseRating } from './types/Rating';
import type { Professor } from './types/Professor';
import AddProfessor from './components/AddProfessor';
import ProfessorDetail from './components/ProfessorDetail';

// Create a black and white theme
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
      paper: '#fafafa',
    },
    text: {
      primary: '#000000',
      secondary: '#666666',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e0e0e0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          color: '#ffffff',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        outlined: {
          borderColor: '#000000',
          color: '#000000',
        },
      },
    },
  },
});

// Calculate average rating from Firebase ratings
const calculateAverageRating = (ratings: FirebaseRating[]): number => {
  if (ratings.length === 0) return 0;
  const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);
  return total / ratings.length;
};

function App() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [filteredProfessors, setFilteredProfessors] = useState<Professor[]>([]);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addProfessorOpen, setAddProfessorOpen] = useState(false);
  const [professorDetailOpen, setProfessorDetailOpen] = useState(false);
  const [newRating, setNewRating] = useState<number | null>(0);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [professorsLoading, setProfessorsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [professorRatings, setProfessorRatings] = useState<{[key: string]: FirebaseRating[]}>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

  // Get unique values for filtering
  const schools = Array.from(new Set(professors.map((prof: Professor) => prof.university))).sort();
  const departments = Array.from(new Set(professors.map((prof: Professor) => prof.department))).sort();
  const subjects = Array.from(new Set(professors.flatMap((prof: Professor) => prof.subjects || []))).sort();

  // Load professors from Firebase
  const loadProfessors = async () => {
    setProfessorsLoading(true);
    try {
      const firebaseProfessors = await getProfessors();
      setProfessors(firebaseProfessors);
      
      // Load ratings for each professor
      const ratingsMap: {[key: string]: FirebaseRating[]} = {};
      for (const professor of firebaseProfessors) {
        try {
          const ratings = await getRatingsByProfessor(professor.name, professor.university);
          ratingsMap[`${professor.name}-${professor.university}`] = ratings;
        } catch (err) {
          console.error(`Error loading ratings for ${professor.name}:`, err);
        }
      }
      setProfessorRatings(ratingsMap);
    } catch (err: any) {
      setError(`Failed to load professors: ${err.message}`);
    } finally {
      setProfessorsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = professors;
    
    if (searchTerm) {
      filtered = filtered.filter((prof: Professor) => 
        prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.university.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prof.subjects || []).some(subject => 
          subject.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    if (selectedSchool) {
      filtered = filtered.filter((prof: Professor) => prof.university === selectedSchool);
    }

    if (selectedDepartment) {
      filtered = filtered.filter((prof: Professor) => prof.department === selectedDepartment);
    }

    if (selectedSubject) {
      filtered = filtered.filter((prof: Professor) => 
        (prof.subjects || []).includes(selectedSubject)
      );
    }
    
    setFilteredProfessors(filtered);
  }, [searchTerm, selectedSchool, selectedDepartment, selectedSubject, professors]);

  // Load professors on component mount
  useEffect(() => {
    loadProfessors();
    setLoading(false);
  }, []);

  const handleRateClick = (professor: Professor) => {
    // Check if user has already rated this professor
    if (hasUserRatedProfessor(professor.name, professor.university)) {
      setError('You have already rated this professor. Each person can only rate once per professor.');
      return;
    }
    
    setSelectedProfessor(professor);
    setDialogOpen(true);
    setError('');
  };

  const handleViewDetails = (professor: Professor) => {
    setSelectedProfessor(professor);
    setProfessorDetailOpen(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedProfessor || !newRating || newRating === 0) {
      setError('Please provide a rating');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Add rating to Firebase
      const ratingData: Omit<FirebaseRating, 'id' | 'createdAt'> = {
        userId: '', // Will be set by the service
        professorId: selectedProfessor.id || '',
        professorName: selectedProfessor.name,
        university: selectedProfessor.university,
        rating: newRating,
        review: newComment || ''
      };

      console.log('Submitting rating data:', ratingData);
      await addRating(ratingData);
      console.log('Rating submitted successfully');

      // Refresh ratings for this professor
      const updatedRatings = await getRatingsByProfessor(selectedProfessor.name, selectedProfessor.university);
      setProfessorRatings(prev => ({
        ...prev,
        [`${selectedProfessor.name}-${selectedProfessor.university}`]: updatedRatings
      }));

      setDialogOpen(false);
      setNewRating(0);
      setNewComment('');
      setSelectedProfessor(null);
      
      // Show enhanced success message
      setSuccessMessage(`🎉 Thank you! Your rating for ${selectedProfessor.name} has been submitted successfully!`);
      setShowSuccessSnackbar(true);
      setError(''); // Clear any existing errors
      
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      setError(error.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddProfessorSuccess = () => {
    // Reload professors after adding a new one
    loadProfessors();
    setAddProfessorOpen(false);
    
    // Show success notification
    setSuccessMessage('✅ Professor added successfully! Thank you for contributing to the community!');
    setShowSuccessSnackbar(true);
    setError(''); // Clear any existing errors
  };

  // Get ratings for a professor
  const getProfessorRatings = (professor: Professor): FirebaseRating[] => {
    return professorRatings[`${professor.name}-${professor.university}`] || [];
  };

  // Check if user can rate a professor
  const canRateProfessor = (professor: Professor): boolean => {
    return !hasUserRatedProfessor(professor.name, professor.university);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSchool('');
    setSelectedDepartment('');
    setSelectedSubject('');
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress sx={{ color: '#000000' }} />
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* Top Navigation */}
      <AppBar position="static" sx={{ backgroundColor: '#000000' }}>
        <Toolbar>
          <School sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          EduRate
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<Add />}
            onClick={() => setAddProfessorOpen(true)}
            sx={{ 
              mr: 2,
              border: '1px solid white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Add
          </Button>
          <Typography variant="body2" color="inherit">
            Open Community Platform
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            mb: 4, 
            backgroundColor: '#000000', 
            color: 'white',
            border: '2px solid #000000'
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <School fontSize="large" />
            EduRate
          </Typography>
          <Typography variant="h6">
            Community-driven Platform to Rate Educators/Courses
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
          • Empowering Educators Through Feedback • No registration required • Help fellow students
          </Typography>
        </Paper>

        {error && (
          <Alert 
            severity={error.includes('already rated') ? 'warning' : 'error'} 
            sx={{ mb: 3 }} 
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {/* Enhanced Search and Filter Section */}
        <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <FilterList sx={{ mr: 1 }} />
            <Typography variant="h6">Search & Filters</Typography>
            <Button 
              size="small" 
              onClick={clearFilters}
              sx={{ ml: 'auto', color: '#666666' }}
            >
              Clear All
            </Button>
          </Box>
          
          {/* Search Bar */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search professors, schools, departments, or subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
            }}
            sx={{ mb: 3 }}
          />

          {/* Filter Options */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>School/University</InputLabel>
              <Select
                value={selectedSchool}
                label="School/University"
                onChange={(e) => setSelectedSchool(e.target.value)}
              >
                <MenuItem value="">All Schools</MenuItem>
                {schools.map((school) => (
                  <MenuItem key={school} value={school}>
                    {school}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={selectedDepartment}
                label="Department"
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((department) => (
                  <MenuItem key={department} value={department}>
                    {department}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>



            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '120px' }}>
              <Typography variant="body2" color="text.secondary">
                {filteredProfessors.length} of {professors.length} professors
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Results Section */}
        {professorsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress sx={{ color: '#000000' }} />
          </Box>
        ) : (
          <>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, color: '#000000' }}>
              Found {filteredProfessors.length} professors
            </Typography>

            {filteredProfessors.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Person sx={{ fontSize: 64, color: '#666666', mb: 2 }} />
                <Typography variant="h6" color="#666666" gutterBottom>
                  No professors found
                </Typography>
                <Typography variant="body1" color="#666666" sx={{ mb: 3 }}>
                  {professors.length === 0 
                    ? "No professors in the database yet. Be the first to add one!"
                    : "Try adjusting your search criteria or clearing filters"
                  }
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<Add />}
                  onClick={() => setAddProfessorOpen(true)}
                  sx={{ 
                    backgroundColor: '#000000',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#333333'
                    }
                  }}
                >
                  Add
                </Button>
              </Box>
            ) : (
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: {
                  xs: '1fr',                          // 1 column on extra small screens
                  sm: 'repeat(2, 1fr)',              // 2 columns on small screens
                  md: 'repeat(3, 1fr)',              // 3 columns on medium screens  
                  lg: 'repeat(4, 1fr)',              // 4 columns on large screens
                  xl: 'repeat(4, 1fr)'               // 4 columns on extra large screens
                }, 
                gap: 3 
              }}>
                {filteredProfessors.map((professor) => {
                  const ratings = getProfessorRatings(professor);
                  const averageRating = calculateAverageRating(ratings);
                  const totalRatings = ratings.length;
                  const userCanRate = canRateProfessor(professor);
                  
                  return (
                    <Card 
                      key={professor.id || professor.name} 
                      elevation={0} 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        border: '1px solid #e0e0e0',
                        '&:hover': {
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          transform: 'translateY(-1px)',
                          transition: 'all 0.2s ease'
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ mr: 2, bgcolor: '#000000', color: 'white' }}>
                            {professor.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" component="h2" sx={{ color: '#000000' }}>
                              {professor.name}
                            </Typography>
                            <Typography variant="body2" color="#666666">
                              {professor.title}
                            </Typography>
                            <Typography variant="body2" color="#666666">
                              {professor.department}
                            </Typography>
                          </Box>
                        </Box>

                        <Chip 
                          label={professor.university} 
                          variant="outlined" 
                          size="small" 
                          sx={{ 
                            mb: 2,
                            borderColor: '#000000',
                            color: '#000000'
                          }}
                        />

                        {professor.subjects && professor.subjects.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="#666666">
                              Subjects:
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                              {professor.subjects.slice(0, 3).map((subject) => (
                                <Chip 
                                  key={subject} 
                                  label={subject} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ 
                                    mr: 0.5, 
                                    mb: 0.5, 
                                    fontSize: '0.7rem',
                                    borderColor: '#666666',
                                    color: '#666666'
                                  }}
                                />
                              ))}
                              {professor.subjects.length > 3 && (
                                <Typography variant="caption" color="#666666">
                                  +{professor.subjects.length - 3} more
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        )}

                        <Divider sx={{ my: 2, borderColor: '#e0e0e0' }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Rating value={averageRating} readOnly precision={0.1} sx={{ color: '#000000' }} />
                          <Typography variant="body2" sx={{ ml: 1, color: '#666666' }}>
                            {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'} ({totalRatings} reviews)
                          </Typography>
                        </Box>

                        {ratings.length > 0 && ratings[0].review && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="#666666" sx={{ fontStyle: 'italic' }}>
                              "{ratings[0].review.length > 100 ? ratings[0].review.substring(0, 100) + '...' : ratings[0].review}"
                            </Typography>
                          </Box>
                        )}
                      </CardContent>

                      <Box sx={{ p: 2, pt: 0 }}>
                        <Stack spacing={1}>
                          <Button 
                            variant="outlined" 
                            fullWidth 
                            startIcon={<Visibility />}
                            onClick={() => handleViewDetails(professor)}
                            sx={{
                              borderColor: '#000000',
                              color: '#000000',
                              '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.04)',
                                borderColor: '#000000'
                              }
                            }}
                          >
                            View Details
                          </Button>
                          <Button 
                            variant="contained" 
                            fullWidth 
                            startIcon={<Star />}
                            onClick={() => handleRateClick(professor)}
                            disabled={submitting || !userCanRate}
                            sx={{
                              backgroundColor: userCanRate ? '#000000' : '#666666',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: userCanRate ? '#333333' : '#666666'
                              },
                              '&:disabled': {
                                backgroundColor: '#cccccc',
                                color: '#666666'
                              }
                            }}
                          >
                            {userCanRate ? 'Rate' : 'Already Rated'}
                          </Button>
                        </Stack>
                      </Box>
                    </Card>
                  );
                })}
              </Box>
            )}
          </>
        )}

        {/* Floating Action Button */}
        <Fab 
          aria-label="add"
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16,
            backgroundColor: '#000000',
            color: 'white',
            '&:hover': {
              backgroundColor: '#333333'
            }
          }}
          onClick={() => setAddProfessorOpen(true)}
        >
          <Add />
        </Fab>

        {/* Rating Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ color: '#000000' }}>
            Rate {selectedProfessor?.name}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ py: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                You can only rate each professor once. Your rating will be anonymous.
              </Alert>
              
              <Typography component="legend" gutterBottom sx={{ color: '#000000' }}>
                Your Rating *
              </Typography>
              <Rating
                value={newRating}
                onChange={(_event, newValue) => {
                  setNewRating(newValue);
                }}
                size="large"
                sx={{ color: '#000000' }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Your Review (Optional)"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                sx={{ mt: 3 }}
                placeholder="Share your experience with this professor..."
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} disabled={submitting} sx={{ color: '#666666' }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitRating} 
              variant="contained"
              disabled={!newRating || newRating === 0 || submitting}
              startIcon={submitting ? <CircularProgress size={16} /> : null}
              sx={{
                backgroundColor: '#000000',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#333333'
                },
                '&:disabled': {
                  backgroundColor: '#cccccc'
                }
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Professor Dialog */}
        <AddProfessor 
          open={addProfessorOpen}
          onClose={() => setAddProfessorOpen(false)}
          onSuccess={handleAddProfessorSuccess}
        />

        {/* Professor Detail Dialog */}
        <ProfessorDetail 
          open={professorDetailOpen}
          onClose={() => setProfessorDetailOpen(false)}
          professor={selectedProfessor}
        />

        {/* Success Snackbar */}
        <Snackbar
          open={showSuccessSnackbar}
          autoHideDuration={6000}
          onClose={() => setShowSuccessSnackbar(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ mt: 8 }}
        >
          <Alert 
            onClose={() => setShowSuccessSnackbar(false)} 
            severity="success" 
            variant="filled"
            icon={<CheckCircle />}
            action={
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={() => setShowSuccessSnackbar(false)}
              >
                <Close fontSize="small" />
              </IconButton>
            }
            sx={{ 
              width: '100%',
              backgroundColor: '#000000',
              color: 'white',
              fontWeight: 'bold',
              '& .MuiAlert-icon': {
                color: 'white'
              },
              '& .MuiAlert-action': {
                color: 'white'
              }
            }}
          >
            {successMessage}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App;