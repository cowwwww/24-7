import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Rating,
  Avatar,
  Divider,
  LinearProgress,
  Stack,
  Chip,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Professor } from '../types/Professor';
import { Rating as RatingType } from '../types/Rating';
import { getRatingsByProfessor } from '../services/ratingService';

interface ProfessorDetailProps {
  open: boolean;
  onClose: () => void;
  professor: Professor | null;
}

interface RatingDistribution {
  [key: number]: number;
}

const ProfessorDetail: React.FC<ProfessorDetailProps> = ({ open, onClose, professor }) => {
  const [ratings, setRatings] = useState<RatingType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (professor && open) {
      fetchRatings();
    }
  }, [professor, open]);

  const fetchRatings = async () => {
    if (!professor) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const professorRatings = await getRatingsByProfessor(professor.name, professor.university);
      setRatings(professorRatings);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateRatingDistribution = (): RatingDistribution => {
    const distribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    ratings.forEach(rating => {
      distribution[rating.rating] = (distribution[rating.rating] || 0) + 1;
    });
    
    return distribution;
  };

  const calculateAverageRating = (): number => {
    if (ratings.length === 0) return 0;
    const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    return total / ratings.length;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!professor) return null;

  const distribution = calculateRatingDistribution();
  const averageRating = calculateAverageRating();
  const totalRatings = ratings.length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="div">
            Professor Details
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ minHeight: '500px' }}>
        {/* Professor Info Header */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              <Box sx={{ flex: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}>
                    {getInitials(professor.name)}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="h1">
                      {professor.name}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {professor.title}
                    </Typography>
                  </Box>
                </Box>
                
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      {professor.university} • {professor.department}
                    </Typography>
                  </Box>
                  
                  {professor.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">{professor.email}</Typography>
                    </Box>
                  )}
                  
                  {professor.subjects && professor.subjects.length > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Subjects:
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {professor.subjects.map((subject) => (
                          <Chip key={subject} label={subject} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Box>
              
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                    {averageRating.toFixed(1)}
                  </Typography>
                  <Rating value={averageRating} precision={0.1} readOnly size="large" />
                  <Typography variant="body2" color="text.secondary">
                    Based on {totalRatings} review{totalRatings !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* Rating Distribution */}
            {totalRatings > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Rating Distribution
                  </Typography>
                  
                  {[5, 4, 3, 2, 1].map((star) => (
                    <Box key={star} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: '20px' }}>
                        {star}
                      </Typography>
                      <Rating value={1} max={1} readOnly size="small" sx={{ mx: 1 }} />
                      <LinearProgress
                        variant="determinate"
                        value={totalRatings > 0 ? (distribution[star] / totalRatings) * 100 : 0}
                        sx={{ flexGrow: 1, mx: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2" sx={{ minWidth: '40px', textAlign: 'right' }}>
                        {distribution[star]} ({totalRatings > 0 ? Math.round((distribution[star] / totalRatings) * 100) : 0}%)
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Individual Reviews */}
            <Typography variant="h6" gutterBottom>
              Reviews ({totalRatings})
            </Typography>
            
            {totalRatings === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No reviews yet. Be the first to rate this professor!
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {ratings.map((rating) => (
                  <Card key={rating.id} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'secondary.main' }}>
                            A
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              Anonymous User
                            </Typography>
                            <Rating value={rating.rating} readOnly size="small" />
                          </Box>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(rating.createdAt)}
                        </Typography>
                      </Box>
                      
                      {rating.review && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          "{rating.review}"
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfessorDetail; 