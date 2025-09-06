import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Rating,
  Chip,
  Grid,
  Paper,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Tabs,
  Tab,
  CircularProgress,
  LinearProgress,
  Badge,
} from '@mui/material';
import {
  Wc as ToiletIcon,
  Restaurant as CanteenIcon,
  School as CourseIcon,
  Person as ProfessorIcon,
  Add as AddIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  AccessTime as WaitTimeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { 
  collection, 
  addDoc, 
  getDocs, 
  orderBy, 
  query, 
  Timestamp,
  where,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

interface FacilityReview {
  id: string;
  type: 'toilet' | 'canteen' | 'course' | 'professor';
  name: string;
  location: string;
  rating: number;
  review: string;
  reviewer: string;
  userId?: string; // For tracking review ownership
  timestamp: Timestamp;
  occupancyLevel?: 'low' | 'medium' | 'high';
  waitTime?: number; // in minutes
}

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
      id={`review-tabpanel-${index}`}
      aria-labelledby={`review-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const ReviewSection: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [reviews, setReviews] = useState<FacilityReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingReview, setEditingReview] = useState<FacilityReview | null>(null);
  const [selectedType, setSelectedType] = useState<'toilet' | 'canteen' | 'course' | 'professor'>('toilet');
  
  const [newReview, setNewReview] = useState({
    name: '',
    location: '',
    rating: 0,
    review: '',
    reviewer: '',
    occupancyLevel: 'medium' as 'low' | 'medium' | 'high',
    waitTime: 0,
  });

  const facilityTypes = [
    { id: 'toilet', label: 'Toilets', icon: <ToiletIcon />, color: '#000000' },
    { id: 'canteen', label: 'Canteens', icon: <CanteenIcon />, color: '#333333' },
    { id: 'course', label: 'Courses', icon: <CourseIcon />, color: '#666666' },
    { id: 'professor', label: 'Professors', icon: <ProfessorIcon />, color: '#999999' },
  ];

  // Get user ID - now requires authentication
  const getUserId = (): string | null => {
    return currentUser ? currentUser.uid : null;
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const reviewsRef = collection(db, 'facilityReviews');
      const q = query(reviewsRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FacilityReview[];
      
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!newReview.name.trim() || !newReview.location.trim() || newReview.rating === 0) {
      return;
    }

    // Require authentication for posting
    if (!currentUser) {
      alert('Please sign up or log in to post reviews. This helps us provide better predictions and allows you to edit your reviews later.');
      return;
    }

    try {
      const reviewData = {
        ...newReview,
        type: selectedType,
        reviewer: newReview.reviewer || currentUser.displayName || 'Anonymous User',
        userId: currentUser.uid,
        timestamp: Timestamp.now(),
      };

      await addDoc(collection(db, 'facilityReviews'), reviewData);
      
      
      setNewReview({
        name: '',
        location: '',
        rating: 0,
        review: '',
        reviewer: '',
        occupancyLevel: 'medium',
        waitTime: 0,
      });
      setOpenDialog(false);
      loadReviews();
    } catch (error) {
      console.error('Error adding review:', error);
    }
  };

  const getOccupancyColor = (level: string) => {
    switch (level) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getOccupancyLabel = (level: string) => {
    switch (level) {
      case 'low': return 'Low Traffic';
      case 'medium': return 'Moderate';
      case 'high': return 'Very Busy';
      default: return 'Unknown';
    }
  };

  const getWaitTimeColor = (waitTime: number) => {
    if (waitTime <= 2) return '#4caf50';
    if (waitTime <= 5) return '#ff9800';
    return '#f44336';
  };

  const getFilteredReviews = (type: string) => {
    return reviews.filter(review => review.type === type);
  };

  const calculateAverageRating = (facilityReviews: FacilityReview[]) => {
    if (facilityReviews.length === 0) return 0;
    const total = facilityReviews.reduce((sum, review) => sum + review.rating, 0);
    return total / facilityReviews.length;
  };

  const getTopRatedFacilities = (type: string) => {
    const filtered = getFilteredReviews(type);
    const grouped = filtered.reduce((acc, review) => {
      const key = `${review.name}-${review.location}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(review);
      return acc;
    }, {} as Record<string, FacilityReview[]>);

    return Object.entries(grouped)
      .map(([key, reviews]) => ({
        name: reviews[0].name,
        location: reviews[0].location,
        averageRating: calculateAverageRating(reviews),
        reviewCount: reviews.length,
        latestOccupancy: reviews[0].occupancyLevel,
        latestWaitTime: reviews[0].waitTime,
      }))
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5);
  };

  const handleEditReview = (review: FacilityReview) => {
    setEditingReview(review);
    setNewReview({
      name: review.name,
      location: review.location,
      rating: review.rating,
      review: review.review,
      reviewer: review.reviewer,
      occupancyLevel: review.occupancyLevel || 'medium',
      waitTime: review.waitTime || 0,
    });
    setSelectedType(review.type);
    setOpenEditDialog(true);
  };

  const handleUpdateReview = async () => {
    if (!editingReview || !newReview.name.trim() || !newReview.location.trim() || newReview.rating === 0) {
      return;
    }

    try {
      const reviewData = {
        ...newReview,
        type: selectedType,
        reviewer: newReview.reviewer || (currentUser ? currentUser.displayName || 'Anonymous User' : 'Anonymous Student'),
        userId: getUserId(),
        timestamp: editingReview.timestamp, // Keep original timestamp
      };

      await updateDoc(doc(db, 'facilityReviews', editingReview.id), reviewData);
      
      setNewReview({
        name: '',
        location: '',
        rating: 0,
        review: '',
        reviewer: '',
        occupancyLevel: 'medium',
        waitTime: 0,
      });
      setEditingReview(null);
      setOpenEditDialog(false);
      loadReviews();
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteDoc(doc(db, 'facilityReviews', reviewId));
        loadReviews();
      } catch (error) {
        console.error('Error deleting review:', error);
      }
    }
  };

  const canEditReview = (review: FacilityReview): boolean => {
    const currentUserId = getUserId();
    return currentUserId !== null && review.userId === currentUserId;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 2, backgroundColor: '#000000', borderRadius: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" component="h1" sx={{ color: 'white', mb: 1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          ⭐ Campus Reviews
        </Typography>
        <Typography variant="body1" sx={{ color: '#cccccc', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Rate facilities, courses & professors - Check real-time occupancy
        </Typography>
      </Paper>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 2, borderRadius: { xs: 2, sm: 1 } }}>
        <Tabs 
          value={currentTab} 
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              minWidth: { xs: 'auto', sm: 120 },
              padding: { xs: '8px 12px', sm: '12px 16px' },
            },
          }}
        >
          {facilityTypes.map((type, index) => (
            <Tab
              key={type.id}
              icon={type.icon}
              label={type.label}
              iconPosition="start"
              sx={{ 
                color: type.color,
                '&.Mui-selected': { color: type.color }
              }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      {facilityTypes.map((type, index) => (
        <TabPanel key={type.id} value={currentTab} index={index}>
          <Box>
            {/* Overview Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Stats Card */}
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                  <Typography variant="h3" sx={{ color: type.color, fontWeight: 'bold' }} gutterBottom>
                    {getFilteredReviews(type.id).length}
                  </Typography>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Total Reviews
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ mt: 2, bgcolor: type.color, color: 'white' }}
                    onClick={() => {
                      if (!currentUser) {
                        alert('Please sign up or log in to post reviews. This helps us provide better predictions and allows you to edit your reviews later.');
                        return;
                      }
                      setSelectedType(type.id as any);
                      setOpenDialog(true);
                    }}
                    fullWidth
                  >
                    {currentUser ? 'Add Review' : 'Sign In to Review'}
                  </Button>
                </Paper>
              </Grid>

              {/* Top Rated Section */}
              <Grid item xs={12} md={9}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    🏆 Top Rated {type.label}
                  </Typography>
                  
                  {getTopRatedFacilities(type.id).length > 0 ? (
                    <Grid container spacing={2}>
                      {getTopRatedFacilities(type.id).map((facility, idx) => (
                        <Grid item xs={12} sm={6} key={idx}>
                          <Box 
                            sx={{ 
                              p: 2, 
                              border: '1px solid #e0e0e0', 
                              borderRadius: 2,
                              '&:hover': { 
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                transform: 'translateY(-1px)',
                                transition: 'all 0.2s ease'
                              }
                            }}
                          >
                            <Typography variant="body1" fontWeight="bold" gutterBottom>
                              {facility.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                              📍 {facility.location}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <Rating value={facility.averageRating} readOnly size="small" />
                              <Typography variant="body2">
                                {facility.averageRating.toFixed(1)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                ({facility.reviewCount} reviews)
                              </Typography>
                            </Box>
                            {(type.id === 'toilet' || type.id === 'canteen') && facility.latestOccupancy && (
                              <Chip
                                size="small"
                                label={getOccupancyLabel(facility.latestOccupancy)}
                                sx={{ 
                                  bgcolor: getOccupancyColor(facility.latestOccupancy),
                                  color: 'white',
                                  fontSize: '0.7rem'
                                }}
                              />
                            )}
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                      No reviews yet. Be the first to rate {type.label.toLowerCase()}!
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>


            {/* Smart Suggestions */}
            {type.id === 'canteen' && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.50' }}>
                <Typography variant="h6" gutterBottom>
                  💡 Smart Suggestions
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  🍎 Study Snacks Available:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Fresh fruit and yogurt parfaits<br/>
                  • Energy bars and nuts<br/>
                  • Coffee and tea selection<br/>
                  • Healthy sandwich options
                </Typography>
              </Paper>
            )}

            {/* All Reviews */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                📝 All Reviews ({getFilteredReviews(type.id).length})
              </Typography>
              <Grid container spacing={3}>
                {getFilteredReviews(type.id).map((review) => (
                  <Grid item xs={12} md={6} lg={4} key={review.id}>
                    <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
                      <CardContent sx={{ pb: 1 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="h6" component="h3">
                          {review.name}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Rating value={review.rating} readOnly size="small" />
                          {canEditReview(review) && (
                            <Box display="flex" gap={0.5}>
                              <IconButton 
                                size="small" 
                                onClick={() => handleEditReview(review)}
                                sx={{ color: 'primary.main' }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteReview(review.id)}
                                sx={{ color: 'error.main' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="textSecondary">
                          {review.location}
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <ScheduleIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="textSecondary">
                          {review.timestamp?.toDate().toLocaleDateString()}
                        </Typography>
                      </Box>

                      {review.review && (
                        <Typography variant="body2" paragraph>
                          "{review.review}"
                        </Typography>
                      )}

                      {/* Occupancy and Wait Time for relevant facilities */}
                      {(type.id === 'toilet' || type.id === 'canteen') && (
                        <Box display="flex" gap={1} mb={2}>
                          {review.occupancyLevel && (
                            <Chip
                              size="small"
                              label={`🚦 ${getOccupancyLabel(review.occupancyLevel)}`}
                              sx={{ 
                                bgcolor: getOccupancyColor(review.occupancyLevel),
                                color: 'white',
                                fontSize: '0.7rem'
                              }}
                            />
                          )}
                          {review.waitTime !== undefined && (
                            <Chip
                              size="small"
                              label={`⏰ ${review.waitTime}min wait`}
                              sx={{ 
                                bgcolor: getWaitTimeColor(review.waitTime),
                                color: 'white',
                                fontSize: '0.7rem'
                              }}
                            />
                          )}
                        </Box>
                      )}

                      <Typography variant="caption" color="textSecondary">
                        - {review.reviewer}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              </Grid>
            </Box>

            {getFilteredReviews(type.id).length === 0 && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No reviews yet for {type.label.toLowerCase()}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Be the first to review and help fellow students!
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ bgcolor: type.color }}
                  onClick={() => {
                    if (!currentUser) {
                      alert('Please sign up or log in to post reviews. This helps us provide better predictions and allows you to edit your reviews later.');
                      return;
                    }
                    setSelectedType(type.id as any);
                    setOpenDialog(true);
                  }}
                >
                  {currentUser ? 'Add First Review' : 'Sign In to Review'}
                </Button>
              </Paper>
            )}
          </Box>
        </TabPanel>
      ))}

      {/* Add Review Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Add Review for {facilityTypes.find(t => t.id === selectedType)?.label}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={newReview.name}
              onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
              fullWidth
              placeholder={`e.g., ${selectedType === 'toilet' ? 'Library 2nd Floor Restroom' : 
                selectedType === 'canteen' ? 'Main Campus Cafeteria' :
                selectedType === 'course' ? 'Introduction to Computer Science' :
                'Dr. Smith - Mathematics'}`}
            />

            <TextField
              label="Location"
              value={newReview.location}
              onChange={(e) => setNewReview({ ...newReview, location: e.target.value })}
              fullWidth
              placeholder="Building/Floor/Room details"
            />

            <Box>
              <Typography component="legend" gutterBottom>
                Rating *
              </Typography>
              <Rating
                value={newReview.rating}
                onChange={(e, newValue) => setNewReview({ ...newReview, rating: newValue || 0 })}
                size="large"
              />
            </Box>

            {(selectedType === 'toilet' || selectedType === 'canteen') && (
              <>
                <TextField
                  select
                  label="Current Occupancy Level"
                  value={newReview.occupancyLevel}
                  onChange={(e) => setNewReview({ ...newReview, occupancyLevel: e.target.value as any })}
                  fullWidth
                  SelectProps={{ native: true }}
                >
                  <option value="low">🟢 Low Traffic - Easily accessible</option>
                  <option value="medium">🟡 Moderate - Some waiting expected</option>
                  <option value="high">🔴 Very Busy - Long wait times</option>
                </TextField>

                <TextField
                  label="Wait Time (minutes)"
                  type="number"
                  value={newReview.waitTime}
                  onChange={(e) => setNewReview({ ...newReview, waitTime: Number(e.target.value) })}
                  fullWidth
                  inputProps={{ min: 0, max: 60 }}
                />
              </>
            )}

            <TextField
              label="Review (Optional)"
              value={newReview.review}
              onChange={(e) => setNewReview({ ...newReview, review: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Share your experience..."
            />

            <TextField
              label="Your Name (Optional)"
              value={newReview.reviewer}
              onChange={(e) => setNewReview({ ...newReview, reviewer: e.target.value })}
              fullWidth
              placeholder="How would you like to be credited?"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitReview} 
            variant="contained"
            disabled={!newReview.name.trim() || !newReview.location.trim() || newReview.rating === 0}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Review Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit Review for {facilityTypes.find(t => t.id === selectedType)?.label}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={newReview.name}
              onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
              fullWidth
              placeholder={`e.g., ${selectedType === 'toilet' ? 'Library 2nd Floor Restroom' : 
                selectedType === 'canteen' ? 'Main Campus Cafeteria' :
                selectedType === 'course' ? 'Introduction to Computer Science' :
                'Dr. Smith - Mathematics'}`}
            />

            <TextField
              label="Location"
              value={newReview.location}
              onChange={(e) => setNewReview({ ...newReview, location: e.target.value })}
              fullWidth
              placeholder="Building/Floor/Room details"
            />

            <Box>
              <Typography component="legend" gutterBottom>
                Rating *
              </Typography>
              <Rating
                value={newReview.rating}
                onChange={(e, newValue) => setNewReview({ ...newReview, rating: newValue || 0 })}
                size="large"
              />
            </Box>

            {(selectedType === 'toilet' || selectedType === 'canteen') && (
              <>
                <TextField
                  select
                  label="Current Occupancy Level"
                  value={newReview.occupancyLevel}
                  onChange={(e) => setNewReview({ ...newReview, occupancyLevel: e.target.value as any })}
                  fullWidth
                  SelectProps={{ native: true }}
                >
                  <option value="low">🟢 Low Traffic - Easily accessible</option>
                  <option value="medium">🟡 Moderate - Some waiting expected</option>
                  <option value="high">🔴 Very Busy - Long wait times</option>
                </TextField>

                <TextField
                  label="Wait Time (minutes)"
                  type="number"
                  value={newReview.waitTime}
                  onChange={(e) => setNewReview({ ...newReview, waitTime: Number(e.target.value) })}
                  fullWidth
                  inputProps={{ min: 0, max: 60 }}
                />
              </>
            )}

            <TextField
              label="Review (Optional)"
              value={newReview.review}
              onChange={(e) => setNewReview({ ...newReview, review: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Share your experience..."
            />

            <TextField
              label="Your Name (Optional)"
              value={newReview.reviewer}
              onChange={(e) => setNewReview({ ...newReview, reviewer: e.target.value })}
              fullWidth
              placeholder="How would you like to be credited?"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateReview} 
            variant="contained"
            disabled={!newReview.name.trim() || !newReview.location.trim() || newReview.rating === 0}
          >
            Update Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewSection;
