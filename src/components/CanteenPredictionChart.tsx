import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Tooltip,
  Paper,
  LinearProgress,
  IconButton,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { 
  getCanteenPredictions, 
  getCachedPredictions,
  storePredictionCache,
  TimeSlotPrediction,
  getCurrentDayOfWeek,
  getCurrentTimeInterval,
  getTimeSlotString
} from '../services/mlPredictionService';

interface CanteenPredictionChartProps {
  canteenId: string;
  canteenName: string;
  onRefresh?: () => void;
}

const CanteenPredictionChart: React.FC<CanteenPredictionChartProps> = ({ 
  canteenId, 
  canteenName, 
  onRefresh 
}) => {
  const [predictions, setPredictions] = useState<TimeSlotPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(getCurrentDayOfWeek());

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    loadPredictions();
  }, [canteenId, selectedDay]);

  const loadPredictions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to get cached predictions first
      let cachedPredictions = await getCachedPredictions(canteenId, selectedDay);
      
      if (cachedPredictions) {
        setPredictions(cachedPredictions);
      } else {
        // Generate new predictions
        const newPredictions = await getCanteenPredictions(canteenId, selectedDay);
        setPredictions(newPredictions);
        
        // Cache the predictions
        await storePredictionCache(canteenId, selectedDay, newPredictions);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadPredictions();
    onRefresh?.();
  };

  const getOccupancyLabel = (occupancy: 'low' | 'medium' | 'high'): string => {
    switch (occupancy) {
      case 'low': return 'Low Traffic';
      case 'medium': return 'Moderate';
      case 'high': return 'Very Busy';
      default: return 'Unknown';
    }
  };

  const getOccupancyIcon = (occupancy: 'low' | 'medium' | 'high'): string => {
    switch (occupancy) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '⚪';
    }
  };

  const getCurrentTimeSlot = (): string => {
    const currentInterval = getCurrentTimeInterval();
    return getTimeSlotString(currentInterval);
  };

  const getCurrentPrediction = (): TimeSlotPrediction | null => {
    const currentInterval = getCurrentTimeInterval();
    return predictions.find(p => p.timeSlot === getTimeSlotString(currentInterval)) || null;
  };

  const getBusyPeriods = (): TimeSlotPrediction[] => {
    return predictions.filter(p => p.predictedOccupancy === 'high' && p.confidence > 0.6);
  };

  const getQuietPeriods = (): TimeSlotPrediction[] => {
    return predictions.filter(p => p.predictedOccupancy === 'low' && p.confidence > 0.6);
  };

  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  if (loading) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" minHeight="200px">
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Analyzing busy patterns...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const currentPrediction = getCurrentPrediction();
  const busyPeriods = getBusyPeriods();
  const quietPeriods = getQuietPeriods();

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h3">
            📊 Busy Time Predictions
          </Typography>
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh predictions">
              <IconButton size="small" onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Based on historical data and machine learning">
              <InfoIcon fontSize="small" color="action" />
            </Tooltip>
          </Box>
        </Box>

        {/* Day Selector */}
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Select Day:
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {dayNames.map((day, index) => (
              <Chip
                key={index}
                label={day}
                size="small"
                variant={selectedDay === index ? "filled" : "outlined"}
                color={selectedDay === index ? "primary" : "default"}
                onClick={() => setSelectedDay(index)}
                sx={{ mb: 1 }}
              />
            ))}
          </Box>
        </Box>

        {/* Current Time Prediction */}
        {currentPrediction && selectedDay === getCurrentDayOfWeek() && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.50' }}>
            <Typography variant="subtitle2" gutterBottom>
              🕐 Current Time ({getCurrentTimeSlot()})
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6">
                {getOccupancyIcon(currentPrediction.predictedOccupancy)} {getOccupancyLabel(currentPrediction.predictedOccupancy)}
              </Typography>
              <Chip 
                size="small" 
                label={`${formatConfidence(currentPrediction.confidence)} confidence`}
                color={currentPrediction.confidence > 0.7 ? "success" : currentPrediction.confidence > 0.4 ? "warning" : "default"}
              />
            </Box>
          </Paper>
        )}

        {/* Quick Insights */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, bgcolor: 'error.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                🔴 Busy Periods
              </Typography>
              {busyPeriods.length > 0 ? (
                <Box>
                  {busyPeriods.slice(0, 3).map((period, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                      {period.timeSlot} ({formatConfidence(period.confidence)})
                    </Typography>
                  ))}
                  {busyPeriods.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{busyPeriods.length - 3} more...
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No busy periods predicted
                </Typography>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, bgcolor: 'success.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                🟢 Quiet Periods
              </Typography>
              {quietPeriods.length > 0 ? (
                <Box>
                  {quietPeriods.slice(0, 3).map((period, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                      {period.timeSlot} ({formatConfidence(period.confidence)})
                    </Typography>
                  ))}
                  {quietPeriods.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{quietPeriods.length - 3} more...
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No quiet periods predicted
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Time Slot Chart */}
        <Typography variant="subtitle2" gutterBottom>
          📈 Hourly Predictions
        </Typography>
        <Box sx={{ maxHeight: '300px', overflowY: 'auto' }}>
          <Grid container spacing={1}>
            {predictions.map((prediction, index) => {
              const isCurrentTime = selectedDay === getCurrentDayOfWeek() && 
                prediction.timeSlot === getCurrentTimeSlot();
              
              return (
                <Grid item xs={6} sm={4} md={3} key={index}>
                  <Tooltip 
                    title={`${getOccupancyLabel(prediction.predictedOccupancy)} - ${formatConfidence(prediction.confidence)} confidence`}
                    arrow
                  >
                    <Paper
                      sx={{
                        p: 1,
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: isCurrentTime ? '2px solid' : '1px solid',
                        borderColor: isCurrentTime ? 'primary.main' : 'divider',
                        bgcolor: prediction.color,
                        '&:hover': {
                          transform: 'scale(1.05)',
                          transition: 'transform 0.2s',
                        }
                      }}
                    >
                      <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                        {prediction.timeSlot}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {getOccupancyIcon(prediction.predictedOccupancy)}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={prediction.confidence * 100}
                        sx={{ 
                          height: 4, 
                          borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.3)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: 'rgba(255,255,255,0.8)'
                          }
                        }}
                      />
                    </Paper>
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* Legend */}
        <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
          <Typography variant="caption" display="block" gutterBottom>
            <strong>Legend:</strong>
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box width={12} height={12} bgcolor="rgba(76, 175, 80, 0.7)" borderRadius="2px" />
              <Typography variant="caption">Low Traffic</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box width={12} height={12} bgcolor="rgba(255, 152, 0, 0.7)" borderRadius="2px" />
              <Typography variant="caption">Moderate</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box width={12} height={12} bgcolor="rgba(244, 67, 54, 0.7)" borderRadius="2px" />
              <Typography variant="caption">Very Busy</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              • Bar height = confidence level
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CanteenPredictionChart;
