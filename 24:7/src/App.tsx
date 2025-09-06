import React, { useState, useEffect } from 'react';
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
  CssBaseline
} from '@mui/material';
import { Search, School, Person, Star } from '@mui/icons-material';
import { theme } from './theme';
import './App.css';

interface Professor {
  id: string;
  name: string;
  school: string;
  department: string;
  averageRating: number;
  totalRatings: number;
  reviews: Review[];
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  date: string;
  anonymous: boolean;
}

// Mock data for demonstration
const mockProfessors: Professor[] = [
  {
    id: '1',
    name: 'Dr. John Smith',
    school: 'Harvard University',
    department: 'Computer Science',
    averageRating: 4.5,
    totalRatings: 23,
    reviews: [
      { id: '1', rating: 5, comment: 'Excellent professor! Very clear explanations.', date: '2024-01-15', anonymous: false },
      { id: '2', rating: 4, comment: 'Good lectures, but assignments are challenging.', date: '2024-01-10', anonymous: true }
    ]
  },
  {
    id: '2',
    name: 'Prof. Sarah Johnson',
    school: 'MIT',
    department: 'Mathematics',
    averageRating: 4.2,
    totalRatings: 18,
    reviews: [
      { id: '3', rating: 4, comment: 'Very knowledgeable and helpful during office hours.', date: '2024-01-12', anonymous: false }
    ]
  },
  {
    id: '3',
    name: 'Dr. Michael Chen',
    school: 'Stanford University',
    department: 'Physics',
    averageRating: 3.8,
    totalRatings: 15,
    reviews: []
  },
  {
    id: '4',
    name: 'Prof. Emily Davis',
    school: 'Harvard University',
    department: 'Biology',
    averageRating: 4.7,
    totalRatings: 31,
    reviews: []
  }
];

function App() {
  const [professors, setProfessors] = useState<Professor[]>(mockProfessors);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [filteredProfessors, setFilteredProfessors] = useState<Professor[]>(mockProfessors);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRating, setNewRating] = useState<number | null>(0);
  const [newComment, setNewComment] = useState('');

  // Get unique schools for filtering
  const schools = Array.from(new Set(professors.map((prof: Professor) => prof.school)));

  useEffect(() => {
    let filtered = professors;
    
    if (searchTerm) {
      filtered = filtered.filter((prof: Professor) => 
        prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedSchool) {
      filtered = filtered.filter((prof: Professor) => prof.school === selectedSchool);
    }
    
    setFilteredProfessors(filtered);
  }, [searchTerm, selectedSchool, professors]);

  const handleRateClick = (professor: Professor) => {
    setSelectedProfessor(professor);
    setDialogOpen(true);
  };

  const handleSubmitRating = () => {
    if (selectedProfessor && newRating !== null && newRating > 0) {
      const newReview: Review = {
        id: Date.now().toString(),
        rating: newRating,
        comment: newComment,
        date: new Date().toISOString().split('T')[0],
        anonymous: true
      };

      const updatedProfessors = professors.map((prof: Professor) => {
        if (prof.id === selectedProfessor.id) {
          const updatedReviews = [...prof.reviews, newReview];
          const newTotalRatings = prof.totalRatings + 1;
          const newAverageRating = (prof.averageRating * prof.totalRatings + newRating) / newTotalRatings;
          
          return {
            ...prof,
            reviews: updatedReviews,
            totalRatings: newTotalRatings,
            averageRating: Math.round(newAverageRating * 10) / 10
          };
        }
        return prof;
      });

      setProfessors(updatedProfessors);
      setDialogOpen(false);
      setNewRating(0);
      setNewComment('');
      setSelectedProfessor(null);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <School fontSize="large" />
            EduRate
          </Typography>
          <Typography variant="h6">
            Search and rate professors from different universities
          </Typography>
        </Paper>

        {/* Search and Filter Section */}
        <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search professors, schools, or departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
              sx={{ flex: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Filter by School"
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              SelectProps={{
                native: true,
              }}
              sx={{ flex: 1 }}
            >
              <option value="">All Schools</option>
              {schools.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </TextField>
          </Stack>
        </Paper>

        {/* Results Section */}
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Found {filteredProfessors.length} professors
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
          {filteredProfessors.map((professor) => (
            <Card key={professor.id} elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="h2">
                      {professor.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {professor.department}
                    </Typography>
                  </Box>
                </Box>

                <Chip 
                  label={professor.school} 
                  variant="outlined" 
                  size="small" 
                  sx={{ mb: 2 }}
                />

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Rating value={professor.averageRating} readOnly precision={0.1} />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {professor.averageRating} ({professor.totalRatings} reviews)
                  </Typography>
                </Box>

                {professor.reviews.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      "{professor.reviews[0].comment}"
                    </Typography>
                  </Box>
                )}
              </CardContent>

              <Box sx={{ p: 2, pt: 0 }}>
                <Button 
                  variant="contained" 
                  fullWidth 
                  startIcon={<Star />}
                  onClick={() => handleRateClick(professor)}
                >
                  Rate Professor
                </Button>
              </Box>
            </Card>
          ))}
        </Box>

        {/* Rating Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Rate {selectedProfessor?.name}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ py: 2 }}>
              <Typography component="legend" gutterBottom>
                Your Rating
              </Typography>
              <Rating
                value={newRating}
                onChange={(event, newValue) => {
                  setNewRating(newValue);
                }}
                size="large"
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
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmitRating} 
              variant="contained"
              disabled={!newRating || newRating === 0}
            >
              Submit Rating
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
}

export default App; 