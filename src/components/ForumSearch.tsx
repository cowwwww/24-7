import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Chip,
  Avatar,
  Divider,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingIcon,
  Star as StarIcon,
  ThumbUp as LikeIcon,
  Reply as ReplyIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  userId?: string;
  isAnonymous: boolean;
  timestamp: any;
  likes: string[];
  replies?: any[];
}

interface SearchSuggestion {
  id: string;
  title: string;
  type: 'trending' | 'popular' | 'recommended' | 'similar';
  score: number;
  category: string;
  likes: number;
  replies: number;
}

interface ForumSearchProps {
  posts: ForumPost[];
  onSearch: (query: string, filters?: any) => void;
  onPostSelect: (postId: string) => void;
}

const ForumSearch: React.FC<ForumSearchProps> = ({ posts, onSearch, onPostSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();

  // Mock user interaction data (in real app, this would come from analytics)
  const getUserInteractionData = () => {
    const interactions = localStorage.getItem(`forum_interactions_${currentUser?.uid}`);
    return interactions ? JSON.parse(interactions) : {
      viewedCategories: {},
      likedPosts: [],
      searchHistory: [],
      timeSpent: {}
    };
  };

  // Generate recommendations based on user behavior
  const generateRecommendations = () => {
    const interactions = getUserInteractionData();
    const recommendations: SearchSuggestion[] = [];

    // Top rated posts overall
    const topRated = posts
      .filter(post => post.likes.length > 0)
      .sort((a, b) => b.likes.length - a.likes.length)
      .slice(0, 3)
      .map(post => ({
        id: post.id,
        title: post.title,
        type: 'popular' as const,
        score: post.likes.length,
        category: post.category,
        likes: post.likes.length,
        replies: post.replies?.length || 0
      }));

    // Trending posts (recent + engagement)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const trending = posts
      .filter(post => {
        const postDate = post.timestamp?.toDate ? post.timestamp.toDate() : new Date(post.timestamp);
        return postDate > oneDayAgo && (post.likes.length > 0 || post.replies?.length > 0);
      })
      .sort((a, b) => {
        const scoreA = a.likes.length + (a.replies?.length || 0) * 2;
        const scoreB = b.likes.length + (b.replies?.length || 0) * 2;
        return scoreB - scoreA;
      })
      .slice(0, 2)
      .map(post => ({
        id: post.id,
        title: post.title,
        type: 'trending' as const,
        score: post.likes.length + (post.replies?.length || 0),
        category: post.category,
        likes: post.likes.length,
        replies: post.replies?.length || 0
      }));

    // AI-powered recommendations based on user preferences
    const userCategories = Object.keys(interactions.viewedCategories || {});
    const recommended = posts
      .filter(post => 
        userCategories.includes(post.category) && 
        !interactions.likedPosts.includes(post.id)
      )
      .sort((a, b) => {
        const categoryScore = (interactions.viewedCategories[a.category] || 0) - 
                             (interactions.viewedCategories[b.category] || 0);
        const engagementScore = b.likes.length - a.likes.length;
        return categoryScore + engagementScore;
      })
      .slice(0, 2)
      .map(post => ({
        id: post.id,
        title: post.title,
        type: 'recommended' as const,
        score: interactions.viewedCategories[post.category] || 0,
        category: post.category,
        likes: post.likes.length,
        replies: post.replies?.length || 0
      }));

    return [...trending, ...topRated, ...recommended];
  };

  // Generate search suggestions based on query
  const generateSearchSuggestions = (query: string) => {
    if (!query.trim()) {
      return generateRecommendations();
    }

    const lowercaseQuery = query.toLowerCase();
    const matchingPosts = posts
      .filter(post => 
        post.title.toLowerCase().includes(lowercaseQuery) ||
        post.content.toLowerCase().includes(lowercaseQuery) ||
        post.category.toLowerCase().includes(lowercaseQuery)
      )
      .sort((a, b) => {
        // Prioritize title matches
        const aTitleMatch = a.title.toLowerCase().includes(lowercaseQuery) ? 10 : 0;
        const bTitleMatch = b.title.toLowerCase().includes(lowercaseQuery) ? 10 : 0;
        
        // Add engagement score
        const aEngagement = a.likes.length + (a.replies?.length || 0);
        const bEngagement = b.likes.length + (b.replies?.length || 0);
        
        return (bTitleMatch + bEngagement) - (aTitleMatch + aEngagement);
      })
      .slice(0, 5)
      .map(post => ({
        id: post.id,
        title: post.title,
        type: 'similar' as const,
        score: post.likes.length,
        category: post.category,
        likes: post.likes.length,
        replies: post.replies?.length || 0
      }));

    return matchingPosts;
  };

  useEffect(() => {
    if (showSuggestions) {
      const newSuggestions = generateSearchSuggestions(searchQuery);
      setSuggestions(newSuggestions);
    }
  }, [searchQuery, showSuggestions, posts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      // Track search in user interactions
      const interactions = getUserInteractionData();
      interactions.searchHistory = [
        searchQuery,
        ...(interactions.searchHistory || []).slice(0, 9)
      ];
      localStorage.setItem(`forum_interactions_${currentUser?.uid}`, JSON.stringify(interactions));
      
      onSearch(searchQuery);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onPostSelect(suggestion.id);
    setSearchQuery(suggestion.title);
    setShowSuggestions(false);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'trending': return <TrendingIcon sx={{ color: '#ff6b35' }} />;
      case 'popular': return <StarIcon sx={{ color: '#ffd700' }} />;
      case 'recommended': return <AIIcon sx={{ color: '#9c27b0' }} />;
      default: return <SearchIcon sx={{ color: '#666' }} />;
    }
  };

  const getSuggestionLabel = (type: string) => {
    switch (type) {
      case 'trending': return 'Trending';
      case 'popular': return 'Popular';
      case 'recommended': return 'For You';
      default: return 'Similar';
    }
  };

  return (
    <Box ref={searchRef} sx={{ position: 'relative', width: '100%', mb: 3 }}>
      <TextField
        fullWidth
        placeholder="Search posts, topics, or ask anything..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: '#666' }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {searchQuery && (
                <IconButton
                  size="small"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                >
                  <ClearIcon />
                </IconButton>
              )}
              <Tooltip title="Advanced Search">
                <IconButton size="small">
                  <FilterIcon />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            backgroundColor: '#f8f9fa',
            '&:hover': {
              backgroundColor: '#ffffff',
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
            }
          }
        }}
      />

      {showSuggestions && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: '400px',
            overflow: 'auto',
            mt: 1,
            borderRadius: 2,
          }}
        >
          {suggestions.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                {searchQuery ? 'No matching posts found' : 'Start typing to search...'}
              </Typography>
            </Box>
          ) : (
            <>
              {!searchQuery && (
                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AIIcon sx={{ fontSize: '1rem' }} />
                    AI-Powered Recommendations
                  </Typography>
                </Box>
              )}
              
              <List sx={{ py: 0 }}>
                {suggestions.map((suggestion, index) => (
                  <React.Fragment key={suggestion.id}>
                    <ListItem
                      component="div"
                      onClick={() => handleSuggestionClick(suggestion)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: '#f5f5f5',
                        },
                        py: 1.5,
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getSuggestionIcon(suggestion.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                              {suggestion.title}
                            </Typography>
                            <Chip
                              label={getSuggestionLabel(suggestion.type)}
                              size="small"
                              sx={{
                                fontSize: '0.7rem',
                                height: 20,
                                backgroundColor: suggestion.type === 'recommended' ? '#e3f2fd' : '#f5f5f5',
                                color: suggestion.type === 'recommended' ? '#1976d2' : '#666',
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                            <Typography variant="caption" color="textSecondary">
                              {suggestion.category}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                <LikeIcon sx={{ fontSize: '0.75rem', color: '#666' }} />
                                <Typography variant="caption">{suggestion.likes}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                <ReplyIcon sx={{ fontSize: '0.75rem', color: '#666' }} />
                                <Typography variant="caption">{suggestion.replies}</Typography>
                              </Box>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < suggestions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>

              {searchQuery && (
                <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
                  <Button
                    fullWidth
                    onClick={handleSearchSubmit}
                    startIcon={<SearchIcon />}
                    sx={{ color: '#000000' }}
                  >
                    Search for "{searchQuery}"
                  </Button>
                </Box>
              )}
            </>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default ForumSearch;
