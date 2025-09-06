import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Grid,
  Paper,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
  Divider,
  Link,
  Tabs,
  Tab,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Link as LinkIcon,
  Work as WorkIcon,
  School as AcademicIcon,
  Code as CodingIcon,
  MenuBook as StudyIcon,
  Psychology as MentalHealthIcon,
  FitnessCenter as HealthIcon,
  Restaurant as FoodIcon,
  DirectionsCar as TransportIcon,
  Home as HousingIcon,
  Add as AddIcon,
  OpenInNew as OpenIcon,
  BookmarkBorder as BookmarkIcon,
  Bookmark as BookmarkedIcon,
  Category as CategoryIcon,
  Star as StarIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { 
  collection, 
  addDoc, 
  getDocs, 
  orderBy, 
  query, 
  Timestamp,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  tags: string[];
  addedBy: string;
  views: number;
  bookmarks: string[];
  timestamp: Timestamp;
  verified: boolean;
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
      id={`resource-tabpanel-${index}`}
      aria-labelledby={`resource-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const ResourceSection: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [bookmarkedResources, setBookmarkedResources] = useState<string[]>([]);

  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    url: '',
    category: '',
    tags: [] as string[],
    addedBy: '',
  });

  const [tagInput, setTagInput] = useState('');

  const categories = [
    { id: 'career', label: 'Career & Jobs', icon: <WorkIcon />, color: '#000000' },
    { id: 'academic', label: 'Academic', icon: <AcademicIcon />, color: '#333333' },
    { id: 'coding', label: 'Programming', icon: <CodingIcon />, color: '#666666' },
    { id: 'study', label: 'Study Resources', icon: <StudyIcon />, color: '#999999' },
    { id: 'health', label: 'Health & Wellness', icon: <HealthIcon />, color: '#000000' },
    { id: 'mental-health', label: 'Mental Health', icon: <MentalHealthIcon />, color: '#333333' },
    { id: 'food', label: 'Food & Dining', icon: <FoodIcon />, color: '#666666' },
    { id: 'transport', label: 'Transportation', icon: <TransportIcon />, color: '#999999' },
    { id: 'housing', label: 'Housing', icon: <HousingIcon />, color: '#000000' },
  ];

  // Pre-populated essential resources
  const essentialResources = [
    {
      title: 'LinkedIn',
      description: 'Professional networking platform for career development',
      url: 'https://linkedin.com',
      category: 'career',
      tags: ['networking', 'jobs', 'professional'],
    },
    {
      title: 'GitHub',
      description: 'Code repository hosting service for developers',
      url: 'https://github.com',
      category: 'coding',
      tags: ['programming', 'code', 'collaboration'],
    },
    {
      title: 'Khan Academy',
      description: 'Free online courses and practice exercises',
      url: 'https://khanacademy.org',
      category: 'academic',
      tags: ['learning', 'courses', 'free'],
    },
    {
      title: 'Coursera',
      description: 'Online courses from top universities and companies',
      url: 'https://coursera.org',
      category: 'academic',
      tags: ['courses', 'certificates', 'university'],
    },
    {
      title: 'Stack Overflow',
      description: 'Question and answer site for programmers',
      url: 'https://stackoverflow.com',
      category: 'coding',
      tags: ['programming', 'help', 'community'],
    },
    {
      title: 'Headspace',
      description: 'Meditation and mindfulness app',
      url: 'https://headspace.com',
      category: 'mental-health',
      tags: ['meditation', 'wellness', 'mental-health'],
    },
    {
      title: 'Glassdoor',
      description: 'Job search, company reviews, and salary information',
      url: 'https://glassdoor.com',
      category: 'career',
      tags: ['jobs', 'salaries', 'reviews'],
    },
    {
      title: 'Quizlet',
      description: 'Study tools including flashcards and practice tests',
      url: 'https://quizlet.com',
      category: 'study',
      tags: ['flashcards', 'study', 'memorization'],
    },
  ];

  useEffect(() => {
    loadResources();
    initializeEssentialResources();
  }, []);

  const initializeEssentialResources = async () => {
    try {
      // Check if essential resources already exist
      const resourcesRef = collection(db, 'resources');
      const snapshot = await getDocs(resourcesRef);
      
      if (snapshot.empty) {
        // Add essential resources if none exist
        for (const resource of essentialResources) {
          await addDoc(resourcesRef, {
            ...resource,
            addedBy: 'System',
            views: Math.floor(Math.random() * 100),
            bookmarks: [],
            timestamp: Timestamp.now(),
            verified: true,
          });
        }
        loadResources();
      }
    } catch (error) {
      console.error('Error initializing essential resources:', error);
    }
  };

  const loadResources = async () => {
    try {
      const resourcesRef = collection(db, 'resources');
      const q = query(resourcesRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      const resourcesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resource[];
      
      setResources(resourcesData);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResource = async () => {
    if (!newResource.title.trim() || !newResource.url.trim() || !newResource.category) {
      return;
    }

    try {
      const resourceData = {
        ...newResource,
        addedBy: newResource.addedBy || 'Anonymous Student',
        views: 0,
        bookmarks: [],
        timestamp: Timestamp.now(),
        verified: false,
      };

      await addDoc(collection(db, 'resources'), resourceData);
      
      setNewResource({
        title: '',
        description: '',
        url: '',
        category: '',
        tags: [],
        addedBy: '',
      });
      setOpenDialog(false);
      loadResources();
    } catch (error) {
      console.error('Error adding resource:', error);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !newResource.tags.includes(tagInput.trim())) {
      setNewResource({
        ...newResource,
        tags: [...newResource.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setNewResource({
      ...newResource,
      tags: newResource.tags.filter(t => t !== tag)
    });
  };

  const handleBookmark = async (resourceId: string) => {
    const userId = 'current_user'; // In a real app, get from auth
    try {
      const resourceRef = doc(db, 'resources', resourceId);
      
      if (bookmarkedResources.includes(resourceId)) {
        await updateDoc(resourceRef, {
          bookmarks: arrayRemove(userId)
        });
        setBookmarkedResources(prev => prev.filter(id => id !== resourceId));
      } else {
        await updateDoc(resourceRef, {
          bookmarks: arrayUnion(userId)
        });
        setBookmarkedResources(prev => [...prev, resourceId]);
      }
      
      loadResources();
    } catch (error) {
      console.error('Error bookmarking resource:', error);
    }
  };

  const handleViewResource = async (resource: Resource) => {
    try {
      const resourceRef = doc(db, 'resources', resource.id);
      await updateDoc(resourceRef, {
        views: resource.views + 1
      });
      
      // Open the URL
      window.open(resource.url, '_blank');
      loadResources();
    } catch (error) {
      console.error('Error updating views:', error);
    }
  };

  const getFilteredResources = (category?: string) => {
    let filtered = resources;

    if (category) {
      filtered = filtered.filter(resource => resource.category === category);
    }

    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(resource => resource.category === selectedCategory);
    }

    return filtered;
  };

  const getPopularResources = () => {
    return resources
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);
  };

  const getBookmarkedResources = () => {
    return resources.filter(resource => 
      resource.bookmarks.includes('current_user')
    );
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.icon : <LinkIcon />;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.color : '#9e9e9e';
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
          🔗 Resources
        </Typography>
        <Typography variant="body1" sx={{ color: '#cccccc', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Useful links & student tools
        </Typography>
      </Paper>

      {/* Search and Add */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="textSecondary">
              {getFilteredResources().length} resources found
            </Typography>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              fullWidth
            >
              Add Resource
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<StarIcon />} label="Popular" iconPosition="start" />
          <Tab icon={<CategoryIcon />} label="By Category" iconPosition="start" />
          <Tab icon={<BookmarkedIcon />} label="My Bookmarks" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={currentTab} index={0}>
        {/* Popular Resources */}
        <Typography variant="h6" gutterBottom>
          🔥 Most Viewed Resources
        </Typography>
        <Grid container spacing={2}>
          {getPopularResources().map((resource) => (
            <Grid item xs={12} md={6} lg={4} key={resource.id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar sx={{ bgcolor: getCategoryColor(resource.category) }}>
                      {getCategoryIcon(resource.category)}
                    </Avatar>
                    <Box flexGrow={1}>
                      <Typography variant="h6" component="h3">
                        {resource.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {resource.description}
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={() => handleBookmark(resource.id)}
                      color={resource.bookmarks.includes('current_user') ? 'primary' : 'default'}
                    >
                      {resource.bookmarks.includes('current_user') ? <BookmarkedIcon /> : <BookmarkIcon />}
                    </IconButton>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip
                      label={categories.find(cat => cat.id === resource.category)?.label || resource.category}
                      size="small"
                      sx={{ bgcolor: getCategoryColor(resource.category), color: 'white' }}
                    />
                    <Chip
                      icon={<ViewIcon />}
                      label={`${resource.views} views`}
                      size="small"
                      variant="outlined"
                    />
                    {resource.verified && (
                      <Chip
                        label="Verified"
                        size="small"
                        color="success"
                      />
                    )}
                  </Box>

                  {resource.tags.length > 0 && (
                    <Box>
                      {resource.tags.slice(0, 3).map((tag) => (
                        <Chip
                          key={tag}
                          label={`#${tag}`}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
                        />
                      ))}
                      {resource.tags.length > 3 && (
                        <Typography variant="caption" color="textSecondary">
                          +{resource.tags.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  <Button
                    startIcon={<OpenIcon />}
                    onClick={() => handleViewResource(resource)}
                    fullWidth
                    variant="contained"
                    sx={{ bgcolor: getCategoryColor(resource.category) }}
                  >
                    Visit
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {/* By Category */}
        {categories.map((category) => {
          const categoryResources = getFilteredResources(category.id);
          
          if (categoryResources.length === 0) return null;

          return (
            <Box key={category.id} mb={4}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {category.icon}
                {category.label} ({categoryResources.length})
              </Typography>
              
              <Grid container spacing={2}>
                {categoryResources.slice(0, 6).map((resource) => (
                  <Grid item xs={12} md={6} lg={4} key={resource.id}>
                    <Card elevation={1} sx={{ height: '100%' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                          <Typography variant="h6" component="h3">
                            {resource.title}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleBookmark(resource.id)}
                            color={resource.bookmarks.includes('current_user') ? 'primary' : 'default'}
                          >
                            {resource.bookmarks.includes('current_user') ? <BookmarkedIcon /> : <BookmarkIcon />}
                          </IconButton>
                        </Box>
                        
                        <Typography variant="body2" color="textSecondary" paragraph>
                          {resource.description}
                        </Typography>

                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Chip
                            icon={<ViewIcon />}
                            label={`${resource.views} views`}
                            size="small"
                            variant="outlined"
                          />
                          {resource.verified && (
                            <Chip
                              label="✓"
                              size="small"
                              color="success"
                            />
                          )}
                        </Box>

                        <Button
                          startIcon={<OpenIcon />}
                          onClick={() => handleViewResource(resource)}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: category.color, color: category.color }}
                        >
                          Visit
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              {categoryResources.length > 6 && (
                <Box textAlign="center" mt={2}>
                  <Button variant="outlined" size="small">
                    View all {categoryResources.length} resources
                  </Button>
                </Box>
              )}
            </Box>
          );
        })}
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {/* Bookmarked Resources */}
        {getBookmarkedResources().length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No bookmarked resources yet
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Start bookmarking useful resources to find them easily later!
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {getBookmarkedResources().map((resource) => (
              <Grid item xs={12} md={6} lg={4} key={resource.id}>
                <Card elevation={2}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar sx={{ bgcolor: getCategoryColor(resource.category) }}>
                        {getCategoryIcon(resource.category)}
                      </Avatar>
                      <Box flexGrow={1}>
                        <Typography variant="h6">{resource.title}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {resource.description}
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      startIcon={<OpenIcon />}
                      onClick={() => handleViewResource(resource)}
                      variant="contained"
                      fullWidth
                      sx={{ bgcolor: getCategoryColor(resource.category) }}
                    >
                      Visit
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Add Resource Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Resource</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={newResource.title}
              onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
              fullWidth
              required
              placeholder="e.g., LinkedIn, Khan Academy, etc."
            />

            <TextField
              label="URL"
              value={newResource.url}
              onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
              fullWidth
              required
              placeholder="https://..."
            />

            <TextField
              label="Description"
              value={newResource.description}
              onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="Briefly describe what this resource is for..."
            />

            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={newResource.category}
                onChange={(e) => setNewResource({ ...newResource, category: e.target.value })}
                label="Category"
              >
                {categories.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {category.icon}
                      {category.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" gutterBottom>Tags</Typography>
              <Box display="flex" gap={1} mb={1}>
                <TextField
                  size="small"
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag}>Add</Button>
              </Box>
              <Box>
                {newResource.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={`#${tag}`}
                    onDelete={() => removeTag(tag)}
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            </Box>

            <TextField
              label="Your Name (Optional)"
              value={newResource.addedBy}
              onChange={(e) => setNewResource({ ...newResource, addedBy: e.target.value })}
              fullWidth
              placeholder="How would you like to be credited?"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitResource} 
            variant="contained"
            disabled={!newResource.title.trim() || !newResource.url.trim() || !newResource.category}
          >
            Add Resource
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResourceSection;
