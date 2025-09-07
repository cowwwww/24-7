import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Grid,
  Chip,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  Star as StarIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import {
  getCanteens,
  addWaitTimeEntry,
  addCanteenRating,
  getWaitTimeEntries,
  getCanteenRatings,
  getTimeOfDay,
  getDayOfWeek,
  isCanteenOpen,
} from '../services/canteenService';
import { initializeSampleCanteens } from '../utils/sampleData';
import type { Canteen, WaitTimeEntry, CanteenRating } from '../types/Canteen';

const CanteenSection: React.FC = () => {
  const { currentUser } = useAuth();
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCanteen, setSelectedCanteen] = useState<Canteen | null>(null);
  const [waitTimeDialogOpen, setWaitTimeDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [waitTime, setWaitTime] = useState<number>(0);
  const [queueLength, setQueueLength] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [foodQuality, setFoodQuality] = useState<number>(0);
  const [serviceQuality, setServiceQuality] = useState<number>(0);
  const [cleanliness, setCleanliness] = useState<number>(0);
  const [valueForMoney, setValueForMoney] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [recentEntries, setRecentEntries] = useState<WaitTimeEntry[]>([]);
  const [recentRatings, setRecentRatings] = useState<CanteenRating[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCanteens();
  }, []);

  const loadCanteens = async () => {
    try {
      setLoading(true);
      const canteensData = await getCanteens();
      setCanteens(canteensData);
    } catch (error) {
      console.error('Error loading canteens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeSampleData = async () => {
    try {
      setLoading(true);
      await initializeSampleCanteens();
      await loadCanteens();
    } catch (error) {
      console.error('Error initializing sample data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWaitTimeSubmit = async () => {
    if (!selectedCanteen || !currentUser || waitTime <= 0) return;

    try {
      setSubmitting(true);
      await addWaitTimeEntry({
        canteenId: selectedCanteen.id,
        userId: currentUser.uid,
        waitTime,
        timeOfDay: getTimeOfDay(),
        dayOfWeek: getDayOfWeek(),
        queueLength: queueLength > 0 ? queueLength : undefined,
        notes: notes.trim() || undefined,
      });

      // Refresh data
      await loadCanteens();
      if (selectedCanteen) {
        await loadCanteenDetails(selectedCanteen.id);
      }

      setWaitTimeDialogOpen(false);
      setWaitTime(0);
      setQueueLength(0);
      setNotes('');
    } catch (error) {
      console.error('Error submitting wait time:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!selectedCanteen || !currentUser || rating <= 0) return;

    try {
      setSubmitting(true);
      await addCanteenRating({
        canteenId: selectedCanteen.id,
        userId: currentUser.uid,
        rating,
        waitTime,
        timeOfDay: getTimeOfDay(),
        dayOfWeek: getDayOfWeek(),
        foodQuality: foodQuality > 0 ? foodQuality : undefined,
        serviceQuality: serviceQuality > 0 ? serviceQuality : undefined,
        cleanliness: cleanliness > 0 ? cleanliness : undefined,
        valueForMoney: valueForMoney > 0 ? valueForMoney : undefined,
        comment: comment.trim() || undefined,
      });

      // Refresh data
      await loadCanteens();
      if (selectedCanteen) {
        await loadCanteenDetails(selectedCanteen.id);
      }

      setRatingDialogOpen(false);
      setRating(0);
      setWaitTime(0);
      setFoodQuality(0);
      setServiceQuality(0);
      setCleanliness(0);
      setValueForMoney(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const loadCanteenDetails = async (canteenId: string) => {
    try {
      const [entries, ratings] = await Promise.all([
        getWaitTimeEntries(canteenId, 10),
        getCanteenRatings(canteenId),
      ]);
      
      setRecentEntries(entries);
      setRecentRatings(ratings.slice(0, 5));
    } catch (error) {
      console.error('Error loading canteen details:', error);
    }
  };

  const handleCanteenClick = (canteen: Canteen) => {
    setSelectedCanteen(canteen);
    loadCanteenDetails(canteen.id);
  };

  const getWaitTimeColor = (waitTime: number): string => {
    if (waitTime <= 5) return '#4caf50'; // Green
    if (waitTime <= 15) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  const getWaitTimeLabel = (waitTime: number): string => {
    if (waitTime <= 5) return 'Fast';
    if (waitTime <= 15) return 'Moderate';
    return 'Long';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          <RestaurantIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Canteen Wait Times
        </Typography>
        <Box display="flex" gap={2}>
          {canteens.length === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleInitializeSampleData}
              disabled={loading}
            >
              Add Sample Canteens
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadCanteens}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {!currentUser && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please log in to submit wait times and ratings.
        </Alert>
      )}

<<<<<<< HEAD
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, 
        gap: 3 
      }}>
        {canteens.map((canteen) => (
          <Box key={canteen.id}>
=======
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {canteens.map((canteen) => (
          <Box key={canteen.id} sx={{ flex: '1 1 300px', maxWidth: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(33.33% - 16px)' } }}>
>>>>>>> f63aa5a026c1017157a9482f6be4a48395a1b70e
            <Card 
              sx={{ 
                height: '100%', 
                cursor: 'pointer',
                '&:hover': { boxShadow: 6 }
              }}
              onClick={() => handleCanteenClick(canteen)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <RestaurantIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="h2">
                      {canteen.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <LocationIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {canteen.location}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" mb={2}>
                  <Chip
                    label={getWaitTimeLabel(canteen.currentWaitTime)}
                    sx={{
                      bgcolor: getWaitTimeColor(canteen.currentWaitTime),
                      color: 'white',
                      mr: 1
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {canteen.currentWaitTime} min wait
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={1}>
                  <StarIcon sx={{ color: 'gold', mr: 0.5, fontSize: 20 }} />
                  <Typography variant="body2">
                    {canteen.averageRating.toFixed(1)} ({canteen.totalRatings} ratings)
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={2}>
                  <ScheduleIcon sx={{ mr: 0.5, fontSize: 16 }} />
                  <Typography variant="body2" color="text.secondary">
                    {canteen.operatingHours.open} - {canteen.operatingHours.close}
                  </Typography>
                  <Chip
                    label={isCanteenOpen(canteen.operatingHours) ? 'Open' : 'Closed'}
                    size="small"
                    color={isCanteenOpen(canteen.operatingHours) ? 'success' : 'default'}
                    sx={{ ml: 1 }}
                  />
                </Box>

                {canteen.description && (
                  <Typography variant="body2" color="text.secondary">
                    {canteen.description}
                  </Typography>
                )}
              </CardContent>

              <CardActions>
                <Button size="small" startIcon={<TimeIcon />}>
                  Report Wait Time
                </Button>
                <Button size="small" startIcon={<StarIcon />}>
                  Rate
                </Button>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Wait Time Dialog */}
      <Dialog open={waitTimeDialogOpen} onClose={() => setWaitTimeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Report Wait Time - {selectedCanteen?.name}
          <IconButton
            onClick={() => setWaitTimeDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Wait Time (minutes)"
              type="number"
              value={waitTime}
              onChange={(e) => setWaitTime(Number(e.target.value))}
              margin="normal"
              inputProps={{ min: 1, max: 120 }}
            />
            <TextField
              fullWidth
              label="Queue Length (optional)"
              type="number"
              value={queueLength}
              onChange={(e) => setQueueLength(Number(e.target.value))}
              margin="normal"
              inputProps={{ min: 0 }}
            />
            <TextField
              fullWidth
              label="Notes (optional)"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              margin="normal"
              placeholder="e.g., Long line at main counter, but express line was fast"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWaitTimeDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleWaitTimeSubmit} 
            variant="contained" 
            disabled={submitting || waitTime <= 0}
          >
            {submitting ? <CircularProgress size={20} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onClose={() => setRatingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Rate Canteen - {selectedCanteen?.name}
          <IconButton
            onClick={() => setRatingDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Box mb={2}>
              <Typography component="legend">Overall Rating</Typography>
              <Rating
                value={rating}
                onChange={(_, newValue) => setRating(newValue || 0)}
                size="large"
              />
            </Box>
            
            <TextField
              fullWidth
              label="Wait Time (minutes)"
              type="number"
              value={waitTime}
              onChange={(e) => setWaitTime(Number(e.target.value))}
              margin="normal"
              inputProps={{ min: 1, max: 120 }}
            />

            <Box mb={2}>
              <Typography component="legend">Food Quality</Typography>
              <Rating
                value={foodQuality}
                onChange={(_, newValue) => setFoodQuality(newValue || 0)}
              />
            </Box>

            <Box mb={2}>
              <Typography component="legend">Service Quality</Typography>
              <Rating
                value={serviceQuality}
                onChange={(_, newValue) => setServiceQuality(newValue || 0)}
              />
            </Box>

            <Box mb={2}>
              <Typography component="legend">Cleanliness</Typography>
              <Rating
                value={cleanliness}
                onChange={(_, newValue) => setCleanliness(newValue || 0)}
              />
            </Box>

            <Box mb={2}>
              <Typography component="legend">Value for Money</Typography>
              <Rating
                value={valueForMoney}
                onChange={(_, newValue) => setValueForMoney(newValue || 0)}
              />
            </Box>

            <TextField
              fullWidth
              label="Comment (optional)"
              multiline
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              margin="normal"
              placeholder="Share your experience..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRatingSubmit} 
            variant="contained" 
            disabled={submitting || rating <= 0}
          >
            {submitting ? <CircularProgress size={20} /> : 'Submit Rating'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Canteen Details Dialog */}
      <Dialog 
        open={!!selectedCanteen} 
        onClose={() => setSelectedCanteen(null)} 
        maxWidth="md" 
        fullWidth
      >
        {selectedCanteen && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center">
                <RestaurantIcon sx={{ mr: 1 }} />
                {selectedCanteen.name}
                <IconButton
                  onClick={() => setSelectedCanteen(null)}
                  sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
<<<<<<< HEAD
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                  gap: 3 
                }}>
                  <Box>
=======
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                  <Box sx={{ flex: 1 }}>
>>>>>>> f63aa5a026c1017157a9482f6be4a48395a1b70e
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Current Status
                      </Typography>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Chip
                          label={getWaitTimeLabel(selectedCanteen.currentWaitTime)}
                          sx={{
                            bgcolor: getWaitTimeColor(selectedCanteen.currentWaitTime),
                            color: 'white',
                            mr: 1
                          }}
                        />
                        <Typography variant="body1">
                          {selectedCanteen.currentWaitTime} minutes
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" mb={1}>
                        <StarIcon sx={{ color: 'gold', mr: 0.5 }} />
                        <Typography variant="body1">
                          {selectedCanteen.averageRating.toFixed(1)}/5.0 ({selectedCanteen.totalRatings} ratings)
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <ScheduleIcon sx={{ mr: 0.5 }} />
                        <Typography variant="body1">
                          {selectedCanteen.operatingHours.open} - {selectedCanteen.operatingHours.close}
                        </Typography>
                        <Chip
                          label={isCanteenOpen(selectedCanteen.operatingHours) ? 'Open' : 'Closed'}
                          size="small"
                          color={isCanteenOpen(selectedCanteen.operatingHours) ? 'success' : 'default'}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </Paper>

<<<<<<< HEAD
                    {prediction && (
                      <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Wait Time Prediction
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          Expected wait: {prediction.predictedWaitTime} minutes
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Based on {prediction.basedOnEntries} recent entries
                        </Typography>
                        <Box display="flex" alignItems="center">
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            Confidence:
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={prediction.confidence * 100}
                            sx={{ flexGrow: 1, mr: 1 }}
                          />
                          <Typography variant="body2">
                            {Math.round(prediction.confidence * 100)}%
                          </Typography>
                        </Box>
                      </Paper>
                    )}
                  </Box>

                  <Box>
=======
                  </Box>

                  <Box sx={{ flex: 1 }}>
>>>>>>> f63aa5a026c1017157a9482f6be4a48395a1b70e
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Recent Wait Times
                      </Typography>
                      <List dense>
                        {recentEntries.slice(0, 5).map((entry) => (
                          <ListItem key={entry.id}>
                            <ListItemIcon>
                              <TimeIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={`${entry.waitTime} minutes`}
                              secondary={`${entry.timeOfDay} • ${new Date(entry.timestamp).toLocaleString()}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>

                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Recent Ratings
                      </Typography>
                      <List dense>
                        {recentRatings.map((rating) => (
                          <ListItem key={rating.id}>
                            <ListItemIcon>
                              <StarIcon sx={{ color: 'gold' }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={`${rating.rating}/5 stars`}
                              secondary={rating.comment || `${rating.waitTime} min wait`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Box>
                </Box>

                <Box display="flex" gap={2} mt={3}>
                  <Button
                    variant="contained"
                    startIcon={<TimeIcon />}
                    onClick={() => setWaitTimeDialogOpen(true)}
                    disabled={!currentUser}
                  >
                    Report Wait Time
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<StarIcon />}
                    onClick={() => setRatingDialogOpen(true)}
                    disabled={!currentUser}
                  >
                    Rate This Canteen
                  </Button>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default CanteenSection;