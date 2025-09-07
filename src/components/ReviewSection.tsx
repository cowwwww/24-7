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
  Fab,
  InputAdornment,
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
  Comment as CommentIcon,
  Visibility as ViewIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Search as SearchIcon,
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
  comments?: ReviewComment[]; // Array of comments
}

interface ReviewComment {
  id: string;
  reviewId: string;
  comment: string;
  rating: number;
  commenter: string;
  userId?: string;
  timestamp: Timestamp;
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
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState<FacilityReview | null>(null);
  const [editingReview, setEditingReview] = useState<FacilityReview | null>(null);
  const [selectedType, setSelectedType] = useState<'toilet' | 'canteen' | 'course' | 'professor'>('toilet');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newReview, setNewReview] = useState({
    name: '',
    location: '',
    rating: 0,
    review: '',
    reviewer: '',
    occupancyLevel: 'medium' as 'low' | 'medium' | 'high',
    waitTime: 0,
  });

  const [newComment, setNewComment] = useState({
    comment: '',
    rating: 0,
    commenter: '',
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
    loadComments();
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

  const loadComments = async () => {
    try {
      const commentsRef = collection(db, 'reviewComments');
      const q = query(commentsRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ReviewComment[];
      
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!newReview.name.trim() || !newReview.location.trim() || newReview.rating === 0) {
      return;
    }

    try {
      const reviewData = {
        ...newReview,
        type: selectedType,
        reviewer: newReview.reviewer || (currentUser ? currentUser.displayName || 'Anonymous User' : 'Anonymous Student'),
        userId: getUserId(),
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
    let filtered = reviews.filter(review => review.type === type);
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(review => 
        review.name.toLowerCase().includes(searchLower) ||
        review.location.toLowerCase().includes(searchLower) ||
        review.review.toLowerCase().includes(searchLower) ||
        review.reviewer.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
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

  const handleSubmitComment = async () => {
    if (!selectedReview || !newComment.comment.trim() || newComment.rating === 0) {
      return;
    }

    try {
      const commentData = {
        reviewId: selectedReview.id,
        comment: newComment.comment,
        rating: newComment.rating,
        commenter: newComment.commenter || (currentUser ? currentUser.displayName || 'Anonymous User' : 'Anonymous Student'),
        userId: getUserId(),
        timestamp: Timestamp.now(),
      };

      await addDoc(collection(db, 'reviewComments'), commentData);
      
      setNewComment({
        comment: '',
        rating: 0,
        commenter: '',
      });
      
      loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleViewReview = (review: FacilityReview) => {
    setSelectedReview(review);
    setOpenDetailDialog(true);
  };

  const getCommentsForReview = (reviewId: string) => {
    return comments.filter(comment => comment.reviewId === reviewId);
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
      {/* Header with Search */}
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 2, backgroundColor: '#000000', borderRadius: { xs: 2, sm: 3 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="h1" sx={{ color: 'white', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            ⭐ Campus Reviews
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: '#cccccc', fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 2 }}>
          Rate facilities, courses & professors - Check real-time occupancy
        </Typography>
        
        {/* Integrated Search Bar */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search reviews, facilities, or reviewers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'white',
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>
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
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, 
              gap: 3, 
              mb: 4 
            }}>
              {/* Stats Card */}


              {/* Top Rated Section */}
              <Box>
                <Paper sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    🏆 Top Rated {type.label}
                  </Typography>
                  
                  {getTopRatedFacilities(type.id).length > 0 ? (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'row',
                      gap: { xs: 1.5, md: 2 },
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      pb: 1,
                      mx: { xs: -0.5, md: 0 }, // Negative margin to extend to edges on mobile
                      px: { xs: 0.5, md: 0 }, // Add horizontal padding on mobile
                      width: { xs: 'calc(100% + 1rem)', md: '100%' }, // Extend width on mobile
                      '&::-webkit-scrollbar': {
                        height: '4px',
                      },
                      '&::-webkit-scrollbar-track': {
                        backgroundColor: '#f1f1f1',
                        borderRadius: '2px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#c1c1c1',
                        borderRadius: '2px',
                        '&:hover': {
                          backgroundColor: '#a8a8a8',
                        },
                      },
                    }}>
                      {getTopRatedFacilities(type.id).map((facility, idx) => (
                        <Box key={idx} sx={{ flexShrink: 0 }}>
                          <Box 
                            sx={{ 
                              p: { xs: 1.5, md: 2 }, 
                              border: '1px solid #e0e0e0', 
                              borderRadius: { xs: 1.5, md: 2 },
                              minWidth: { xs: 180, md: 250 },
                              width: { xs: '180px', md: 'auto' }, // Fixed width on mobile
                              flexShrink: 0,
                              '&:hover': { 
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                transform: 'translateY(-1px)',
                                transition: 'all 0.2s ease'
                              }
                            }}
                          >
                            <Typography 
                              variant="body1" 
                              fontWeight="bold" 
                              gutterBottom
                              sx={{ 
                                fontSize: { xs: '0.9rem', md: '1rem' },
                                lineHeight: 1.2,
                                mb: 1
                              }}
                            >
                              {facility.name}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="textSecondary" 
                              sx={{ 
                                mb: 1,
                                fontSize: { xs: '0.75rem', md: '0.875rem' },
                                lineHeight: 1.3
                              }}
                            >
                              📍 {facility.location}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <Rating 
                                value={facility.averageRating} 
                                readOnly 
                                size="small"
                                sx={{ '& .MuiRating-icon': { fontSize: { xs: '1rem', md: '1.2rem' } } }}
                              />
                              <Typography 
                                variant="body2"
                                sx={{ 
                                  fontSize: { xs: '0.7rem', md: '0.875rem' },
                                  lineHeight: 1.2
                                }}
                              >
                                {facility.averageRating.toFixed(1)}
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
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                      No reviews yet. Be the first to rate {type.label.toLowerCase()}!
                    </Typography>
                  )}
                </Paper>
              </Box>
            </Box>




            {/* All Reviews */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: { xs: 2, md: 3 }, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                📝 All Reviews 
              </Typography>
              <Box sx={{ 
                display: { xs: 'flex', md: 'grid' },
                flexDirection: { xs: 'row', md: 'column' },
                overflowX: { xs: 'auto', md: 'visible' },
                gap: { xs: 1.5, md: 2 },
                pb: { xs: 1, md: 0 },
                '&::-webkit-scrollbar': {
                  height: 4,
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f1f1f1',
                  borderRadius: 2,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#c1c1c1',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: '#a8a8a8',
                  },
                },
                gridTemplateColumns: { md: '1fr 1fr', lg: '1fr 1fr 1fr' }
              }}>
                {getFilteredReviews(type.id)
                  .sort((a, b) => a.rating - b.rating) // Sort from worst to best (lowest to highest rating)
                  .map((review) => (
                  <Box key={review.id} sx={{ 
                    minWidth: { xs: '260px', md: 'auto' },
                    flexShrink: { xs: 0, md: 1 }
                  }}>
                    <Card 
                      elevation={1} 
                      sx={{ 
                        height: '100%', 
                        borderRadius: { xs: 1.5, md: 2 },
                        cursor: 'pointer',
                        '&:hover': {
                          elevation: 3,
                          transform: 'translateY(-1px)',
                          transition: 'all 0.2s ease'
                        }
                      }}
                      onClick={() => handleViewReview(review)}
                    >
                      <CardContent sx={{ p: { xs: 1.5, md: 2 }, pb: { xs: 1, md: 1.5 } }}>
                      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="subtitle1" 
                            component="h3" 
                            sx={{ 
                              fontWeight: 600,
                              fontSize: { xs: '0.9rem', md: '1rem' },
                              lineHeight: 1.2,
                              mb: 0.5
                            }}
                          >
                            {review.name}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                            <LocationIcon fontSize="small" color="action" sx={{ fontSize: '0.8rem' }} />
                            <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                              {review.location}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <ScheduleIcon fontSize="small" color="action" sx={{ fontSize: '0.8rem' }} />
                            <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                              {review.timestamp?.toDate().toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Rating value={review.rating} readOnly size="small" />
                          {canEditReview(review) && (
                            <Box display="flex" gap={0.25}>
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditReview(review);
                                }}
                                sx={{ color: 'primary.main', p: 0.5 }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteReview(review.id);
                                }}
                                sx={{ color: 'error.main', p: 0.5 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                      </Box>

                      {review.review && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                            lineHeight: 1.4,
                            mb: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            color: 'text.secondary'
                          }}
                        >
                          "{review.review}"
                        </Typography>
                      )}

                      {/* Occupancy and Wait Time for relevant facilities */}
                      {(type.id === 'toilet' || type.id === 'canteen') && (
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {review.occupancyLevel && (
                            <Chip
                              size="small"
                              label={getOccupancyLabel(review.occupancyLevel)}
                              sx={{ 
                                bgcolor: getOccupancyColor(review.occupancyLevel),
                                color: 'white',
                                fontSize: '0.65rem',
                                height: 18,
                                '& .MuiChip-label': { px: 0.75 }
                              }}
                            />
                          )}
                          {review.waitTime !== undefined && (
                            <Chip
                              size="small"
                              label={`${review.waitTime}min`}
                              sx={{ 
                                bgcolor: getWaitTimeColor(review.waitTime),
                                color: 'white',
                                fontSize: '0.65rem',
                                height: 18,
                                '& .MuiChip-label': { px: 0.75 }
                              }}
                            />
                          )}
                        </Box>
                      )}

                      <Typography variant="caption" color="textSecondary">
                        - {review.reviewer}
                      </Typography>

                      {/* Comment and Rating Summary */}
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} pt={1} borderTop="1px solid #e0e0e0">
                        <Box display="flex" alignItems="center" gap={1}>
                          <CommentIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="textSecondary">
                            {getCommentsForReview(review.id).length} comments
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ViewIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="textSecondary">
                            View Details
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                  </Box>
                ))}
              </Box>
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
                    setSelectedType(type.id as any);
                    setOpenDialog(true);
                  }}
                >
                  Add First Review
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

      {/* Review Detail Dialog with Comments */}
      <Dialog 
        open={openDetailDialog} 
        onClose={() => setOpenDetailDialog(false)} 
        maxWidth="md" 
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedReview?.name} - Details
            </Typography>
            <IconButton onClick={() => setOpenDetailDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Stack spacing={3}>
              {/* Original Review */}
              <Paper sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                  <Typography variant="h6">{selectedReview.name}</Typography>
                  <Rating value={selectedReview.rating} readOnly />
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  📍 {selectedReview.location}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  📅 {selectedReview.timestamp?.toDate().toLocaleDateString()}
                </Typography>
                {selectedReview.review && (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    "{selectedReview.review}"
                  </Typography>
                )}
                <Typography variant="caption" color="textSecondary">
                  - {selectedReview.reviewer}
                </Typography>
              </Paper>

              {/* Comments Section */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  💬 Comments ({getCommentsForReview(selectedReview.id).length})
                </Typography>
                
                {/* Existing Comments */}
                <Stack spacing={2} sx={{ mb: 3 }}>
                  {getCommentsForReview(selectedReview.id).map((comment) => (
                    <Paper key={comment.id} sx={{ p: 2 }}>
                      <Box display="flex" justifyContent="between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2">{comment.commenter}</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Rating value={comment.rating} readOnly size="small" />
                          <Typography variant="caption" color="textSecondary">
                            {comment.timestamp?.toDate().toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2">{comment.comment}</Typography>
                    </Paper>
                  ))}
                </Stack>

                {/* Add New Comment */}
                <Paper sx={{ p: 3, bgcolor: '#f0f8ff' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    💭 Add Your Comment & Rating
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography component="legend" gutterBottom>
                        Your Rating *
                      </Typography>
                      <Rating
                        value={newComment.rating}
                        onChange={(e, newValue) => setNewComment({ ...newComment, rating: newValue || 0 })}
                        size="large"
                      />
                    </Box>

                    <TextField
                      label="Your Comment"
                      value={newComment.comment}
                      onChange={(e) => setNewComment({ ...newComment, comment: e.target.value })}
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Share your thoughts about this review..."
                    />

                    <TextField
                      label="Your Name (Optional)"
                      value={newComment.commenter}
                      onChange={(e) => setNewComment({ ...newComment, commenter: e.target.value })}
                      fullWidth
                      placeholder="How would you like to be credited?"
                    />

                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={handleSubmitComment}
                      disabled={!newComment.comment.trim() || newComment.rating === 0}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Post Comment
                    </Button>
                  </Stack>
                </Paper>
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Action Button for Adding Reviews */}
      <Fab
        color="primary"
        aria-label="add review"
        sx={{ 
          position: 'fixed', 
          bottom: { xs: 90, md: 20 }, 
          right: 20,
          zIndex: 1000
        }}
        onClick={() => {
          setSelectedType(facilityTypes[currentTab].id as any);
          setOpenDialog(true);
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default ReviewSection;