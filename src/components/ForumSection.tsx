import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Divider,
  Stack,
  Paper,
  Fab,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Rating,
} from '@mui/material';
import {
  Add as AddIcon,
  Person as PersonIcon,
  PersonOff as AnonymousIcon,
  Comment as CommentIcon,
  ThumbUp as LikeIcon,
  Reply as ReplyIcon,
  MoreVert as MoreIcon,
  QuestionAnswer as QuestionIcon,
  Lightbulb as IdeaIcon,
  School as StudyIcon,
  Home as LifeIcon,
  MenuBook as StudyZoneIcon,
  Favorite as ConfessionIcon,
  Psychology as TreeHoleIcon,
  Restaurant as FoodIcon,
  FlightTakeoff as TravelIcon,
  ContentCut as HaircutIcon,
  Business as HousingIcon,
  LibraryBooks as MaterialsIcon,
  Visibility as ViewIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { 
  collection, 
  addDoc, 
  getDocs, 
  orderBy, 
  query, 
  updateDoc, 
  doc, 
  arrayUnion,
  arrayRemove,
  Timestamp,
  where 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import ForumSearch from './ForumSearch';

interface ForumComment {
  id: string;
  postId: string;
  comment: string;
  commenter: string;
  userId?: string;
  timestamp: Timestamp;
  likes: string[]; // Array of user IDs who liked this comment
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  userId?: string;
  isAnonymous: boolean;
  category: 'question' | 'idea' | 'discussion' | 'life' | 'study' | 'confession' | 'treehole' | 'food' | 'travel' | 'haircut' | 'housing' | 'materials';
  timestamp: Timestamp;
  likes: string[];
  replies: Reply[];
}

interface Reply {
  id: string;
  content: string;
  author: string;
  isAnonymous: boolean;
  timestamp: Timestamp;
  likes: string[];
}

interface ForumSectionProps {
  highlightedPostId?: string | null;
}

const ForumSection: React.FC<ForumSectionProps> = ({ highlightedPostId }) => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<ForumPost[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [highlightedPost, setHighlightedPost] = useState<string | null>(null);

  // New post form
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    isAnonymous: false,
    category: 'discussion' as 'question' | 'idea' | 'discussion',
  });

  // New comment form
  const [newComment, setNewComment] = useState({
    comment: '',
    commenter: '',
  });

  // Reply form
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [replyContent, setReplyContent] = useState('');
  const [replyAnonymous, setReplyAnonymous] = useState(false);

  useEffect(() => {
    loadPosts();
    loadComments();
  }, []);

  // Filter posts when search query or category changes
  useEffect(() => {
    filterPosts();
  }, [posts, searchQuery, selectedCategory]);

  const loadPosts = async () => {
    try {
      const postsRef = collection(db, 'forumPosts');
      const q = query(postsRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ForumPost[];
      
      setPosts(postsData);
      setFilteredPosts(postsData); // Initialize filtered posts
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const commentsRef = collection(db, 'forumComments');
      const q = query(commentsRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ForumComment[];
      
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleViewPost = (post: ForumPost) => {
    setSelectedPost(post);
    setOpenDetailDialog(true);
  };

  const getCommentsForPost = (postId: string) => {
    return comments.filter(comment => comment.postId === postId);
  };

  const handleSubmitComment = async () => {
    if (!selectedPost || !newComment.comment.trim()) {
      return;
    }

    try {
      const commentData = {
        postId: selectedPost.id,
        comment: newComment.comment,
        commenter: newComment.commenter || (currentUser ? currentUser.displayName || 'Anonymous User' : 'Anonymous Student'),
        userId: currentUser ? currentUser.uid : `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Timestamp.now(),
        likes: [], // Initialize with empty likes array
      };

      await addDoc(collection(db, 'forumComments'), commentData);
      
      setNewComment({
        comment: '',
        commenter: '',
      });
      
      loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    // Generate anonymous user ID if not logged in
    const userId = currentUser?.uid || `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;

      const isLiked = comment.likes?.includes(userId) || false;
      const newLikes = isLiked 
        ? comment.likes?.filter(uid => uid !== userId) || []
        : [...(comment.likes || []), userId];

      await updateDoc(doc(db, 'forumComments', commentId), {
        likes: newLikes
      });

      loadComments();
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };


  // Filter posts based on search query and category
  const filterPosts = () => {
    let filtered = posts;

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.author.toLowerCase().includes(query) ||
        post.category.toLowerCase().includes(query)
      );
    }

    setFilteredPosts(filtered);
  };

  // Handle search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Track user search behavior for AI recommendations
    if (currentUser && query.trim()) {
      const interactions = JSON.parse(
        localStorage.getItem(`forum_interactions_${currentUser.uid}`) || '{}'
      );
      
      // Update search history and category preferences
      interactions.searchHistory = [query, ...(interactions.searchHistory || []).slice(0, 9)];
      
      // Analyze search patterns to understand user preferences
      const searchCategories = posts
        .filter(post => 
          post.title.toLowerCase().includes(query.toLowerCase()) ||
          post.content.toLowerCase().includes(query.toLowerCase())
        )
        .map(post => post.category);
      
      searchCategories.forEach(category => {
        interactions.viewedCategories = interactions.viewedCategories || {};
        interactions.viewedCategories[category] = (interactions.viewedCategories[category] || 0) + 0.5;
      });
      
      localStorage.setItem(`forum_interactions_${currentUser.uid}`, JSON.stringify(interactions));
    }
  };

  // Handle post selection from search suggestions
  const handlePostSelect = (postId: string) => {
    setHighlightedPost(postId);
    
    // Scroll to the post
    setTimeout(() => {
      const element = document.getElementById(`post-${postId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    
    // Clear highlight after 5 seconds
    setTimeout(() => {
      setHighlightedPost(null);
    }, 5000);
    
    // Track user interaction
    if (currentUser) {
      const interactions = JSON.parse(
        localStorage.getItem(`forum_interactions_${currentUser.uid}`) || '{}'
      );
      
      const post = posts.find(p => p.id === postId);
      if (post) {
        interactions.viewedCategories = interactions.viewedCategories || {};
        interactions.viewedCategories[post.category] = 
          (interactions.viewedCategories[post.category] || 0) + 1;
      }
      
      localStorage.setItem(`forum_interactions_${currentUser.uid}`, JSON.stringify(interactions));
    }
  };

  const handleSubmitPost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim() || !currentUser) {
      return;
    }

    setSubmitting(true);
    try {
      const postData = {
        ...newPost,
        author: newPost.isAnonymous ? 'Anonymous' : (currentUser.displayName || currentUser.email || 'Student'),
        userId: currentUser.uid, // Add userId for notifications
        timestamp: Timestamp.now(),
        likes: [],
        replies: [],
      };

      await addDoc(collection(db, 'forumPosts'), postData);
      
      setNewPost({
        title: '',
        content: '',
        isAnonymous: false,
        category: 'discussion',
      });
      setOpenDialog(false);
      loadPosts();
    } catch (error) {
      console.error('Error adding post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (postId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation(); // Prevent opening detail dialog
    }
    
    // Generate anonymous user ID if not logged in
    const userId = currentUser?.uid || `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
      const postRef = doc(db, 'forumPosts', postId);
      const post = posts.find(p => p.id === postId);
      
      if (!post) return;
      
      const currentLikes = post.likes || [];
      const hasLiked = currentLikes.includes(userId);
      
      if (hasLiked) {
        // Unlike the post
        await updateDoc(postRef, {
          likes: arrayRemove(userId)
        });
      } else {
        // Like the post
        await updateDoc(postRef, {
          likes: arrayUnion(userId)
        });
        
        // Send notification to post author (if not liking own post)
        const currentUserDisplayName = currentUser.displayName || currentUser.email || 'Student';
        const isOwnPost = post.userId === userId || 
                         (!post.userId && post.author === currentUserDisplayName);
        
        if (!isOwnPost && post.userId) {
          try {
            await addNotification({
              userId: post.userId,
              type: 'like',
              title: 'Someone liked your post',
              message: `Your forum post "${post.title}" received a like`,
              forumPostId: postId,
              targetSection: 'forum',
              fromUser: {
                name: currentUserDisplayName,
                email: currentUser.email || ''
              }
            });
          } catch (error) {
            console.error('Error sending like notification:', error);
          }
        }
      }
      
      loadPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };


  const handleReply = async () => {
    if (!replyContent.trim() || !currentUser) return;

    try {
      const reply = {
        id: Date.now().toString(),
        content: replyContent,
        author: replyAnonymous ? 'Anonymous' : (currentUser.displayName || currentUser.email || 'Student'),
        userId: currentUser.uid,
        isAnonymous: replyAnonymous,
        timestamp: Timestamp.now(),
        likes: [],
      };

      const postRef = doc(db, 'forumPosts', selectedPostId);
      await updateDoc(postRef, {
        replies: arrayUnion(reply)
      });

      // Send notification to post author (if not replying to own post)
      const post = posts.find(p => p.id === selectedPostId);
      if (post && post.userId && post.userId !== currentUser.uid) {
        await addNotification({
          userId: post.userId,
          type: 'reply',
          title: 'New reply to your post',
          message: `${reply.author} replied to your post "${post.title}"`,
          forumPostId: selectedPostId,
          targetSection: 'forum',
          fromUser: {
            name: reply.author,
            email: currentUser.email || ''
          }
        });
      }

      setReplyContent('');
      setReplyAnonymous(false);
      setReplyDialogOpen(false);
      loadPosts();
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'question': return <QuestionIcon />;
      case 'idea': return <IdeaIcon />;
      default: return <StudyIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'question': return '#666666';
      case 'idea': return '#333333';
      default: return '#000000';
    }
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      px: { xs: 1, sm: 2 }, 
      pb: { xs: 10, sm: 4 } // Extra bottom padding on mobile for FAB
    }}>
      {/* Header with Search */}
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 2, backgroundColor: '#000000', borderRadius: { xs: 2, sm: 3 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="h1" sx={{ color: 'white', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            📚 Forum
          </Typography>
          
        </Box>
        <Typography variant="body1" sx={{ color: '#cccccc', fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 2 }}>
          Ask questions, share ideas, discuss
        </Typography>
        
        {/* Integrated Search Bar */}
        <ForumSearch
          posts={posts}
          onSearch={handleSearch}
          onPostSelect={handlePostSelect}
        />
      </Paper>

      {/* Category Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={selectedCategory} 
          onChange={(e, newValue) => setSelectedCategory(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label="All" 
            value="all"
            sx={{ minWidth: 'auto' }}
          />
          <Tab 
            icon={<QuestionIcon />} 
            label="Questions" 
            value="question"
            iconPosition="start"
            sx={{ minWidth: 'auto' }}
          />
          <Tab 
            icon={<IdeaIcon />} 
            label="Ideas" 
            value="idea"
            iconPosition="start"
            sx={{ minWidth: 'auto' }}
          />
          <Tab 
            icon={<StudyIcon />} 
            label="Discussions" 
            value="discussion"
            iconPosition="start"
            sx={{ minWidth: 'auto' }}
          />
          <Tab 
            icon={<LifeIcon />} 
            label="Life" 
            value="life"
            iconPosition="start"
            sx={{ minWidth: 'auto' }}
          />
          <Tab 
            icon={<StudyZoneIcon />} 
            label="Study Zone" 
            value="study"
            iconPosition="start"
            sx={{ minWidth: 'auto' }}
          />
          <Tab 
            icon={<ConfessionIcon />} 
            label="Confession Wall" 
            value="confession"
            iconPosition="start"
            sx={{ minWidth: 'auto' }}
          />
          <Tab 
            icon={<TreeHoleIcon />} 
            label="Tree Hole" 
            value="treehole"
            iconPosition="start"
            sx={{ minWidth: 'auto' }}
          />
          <Tab 
            icon={<FoodIcon />} 
            label="Food" 
            value="food"
            iconPosition="start"
            sx={{ minWidth: 'auto' }}
          />
          <Tab 
            icon={<TravelIcon />} 
            label="Travel" 
            value="travel"
            iconPosition="start"
            sx={{ minWidth: 'auto' }}
          />
          <Tab 
            icon={<HaircutIcon />} 
            label="Haircut" 
            value="haircut"
            iconPosition="start"
            sx={{ minWidth: 'auto' }}
          />
          <Tab 
            icon={<HousingIcon />} 
            label="Housing" 
            value="housing"
            iconPosition="start"
            sx={{ minWidth: 'auto' }}
          />
          <Tab 
            icon={<MaterialsIcon />} 
            label="Study Materials" 
            value="materials"
            iconPosition="start"
            sx={{ minWidth: 'auto' }}
          />
        </Tabs>
      </Paper>

      {/* Search Results Summary */}
      {searchQuery && (
        <Paper elevation={1} sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
          <Typography variant="body2" color="textSecondary">
            {filteredPosts.length === 0 
              ? `No results found for "${searchQuery}"` 
              : `Found ${filteredPosts.length} result${filteredPosts.length !== 1 ? 's' : ''} for "${searchQuery}"`
            }
            <Button 
              size="small" 
              onClick={() => {
                setSearchQuery('');
                setHighlightedPost(null);
              }}
              sx={{ ml: 2, color: '#000000' }}
            >
              Clear Search
            </Button>
          </Typography>
        </Paper>
      )}

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No posts yet in this category
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Be the first to start a conversation!
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Create Post
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gap: { xs: 1.5, sm: 2 } }}>
          {filteredPosts.map((post) => (
            <Card 
              key={post.id}
              id={`post-${post.id}`}
              elevation={2} 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { 
                  elevation: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease'
                },
                ...(highlightedPostId === post.id && {
                  border: '3px solid #000000',
                  boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s ease'
                }),
                ...((highlightedPost === post.id || highlightedPostId === post.id) && {
                  border: '3px solid #ff6b35',
                  boxShadow: '0 0 15px rgba(255,107,53,0.4)',
                  transition: 'all 0.3s ease',
                  animation: 'glow 2s ease-in-out'
                })
              }}
              onClick={() => handleViewPost(post)}
            >
                <CardContent sx={{ 
                  p: { xs: 2, sm: 3 },
                  '&:last-child': { pb: { xs: 2, sm: 3 } }
                }}>
                  {/* Post Header */}
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar 
                        sx={{ 
                          bgcolor: getCategoryColor(post.category),
                          width: 32, 
                          height: 32 
                        }}
                      >
                        {getCategoryIcon(post.category)}
                      </Avatar>
                      <Box>
                        <Typography 
                          variant="h6" 
                          component="h3"
                          sx={{ 
                            fontSize: { xs: '1rem', sm: '1.25rem' },
                            lineHeight: { xs: 1.3, sm: 1.4 },
                            mb: { xs: 0.5, sm: 1 }
                          }}
                        >
                          {post.title}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          {post.isAnonymous ? <AnonymousIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
                          <Typography 
                            variant="body2" 
                            color="textSecondary"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            {post.author} • {post.timestamp?.toDate().toLocaleDateString()}
                          </Typography>
                          <Chip 
                            label={post.category} 
                            size="small" 
                            sx={{ 
                              bgcolor: getCategoryColor(post.category),
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Post Content */}
                  <Typography 
                    variant="body1" 
                    paragraph
                    sx={{ 
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      lineHeight: { xs: 1.4, sm: 1.5 },
                      mb: { xs: 1.5, sm: 2 }
                    }}
                  >
                    {post.content}
                  </Typography>

                  {/* Post Actions */}
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    gap={{ xs: 1, sm: 2 }}
                    flexWrap="wrap"
                  >
                    <Button
                      startIcon={<LikeIcon />}
                      size="small"
                      onClick={(e) => handleLikePost(post.id, e)}
                      color={post.likes?.includes(currentUser?.uid || '') ? 'primary' : 'inherit'}
                    >
                      {post.likes?.length || 0}
                    </Button>
                    <Button
                      startIcon={<ReplyIcon />}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPostId(post.id);
                        setReplyDialogOpen(true);
                      }}
                    >
                      Reply ({post.replies?.length || 0})
                    </Button>
                    <Button
                      startIcon={<CommentIcon />}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewPost(post);
                      }}
                    >
                      Comment ({getCommentsForPost(post.id).length})
                    </Button>
                  </Box>

                  {/* Replies */}
                  {post.replies && post.replies.length > 0 && (
                    <Box mt={2} pl={2} borderLeft="2px solid #e0e0e0">
                      {post.replies.map((reply) => (
                        <Box key={reply.id} mb={2}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            {reply.isAnonymous ? <AnonymousIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
                            <Typography variant="body2" color="textSecondary">
                              {reply.author} • {reply.timestamp?.toDate?.().toLocaleDateString() || 'Just now'}
                            </Typography>
                          </Box>
                          <Typography variant="body2">
                            {reply.content}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}

                </CardContent>
              </Card>
          ))}
        </Box>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add forum post"
        sx={{ 
          position: 'fixed', 
          bottom: { xs: 90, md: 20 }, // Higher on mobile to avoid bottom nav
          right: 20,
          zIndex: 1000
        }}
        onClick={() => setOpenDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* New Post Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Post</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              select
              label="Category"
              value={newPost.category}
              onChange={(e) => setNewPost({ ...newPost, category: e.target.value as any })}
              fullWidth
            >
              <MenuItem value="question">❓ Question</MenuItem>
              <MenuItem value="idea">💡 Idea</MenuItem>
              <MenuItem value="discussion">💬 Discussion</MenuItem>
              <MenuItem value="life">🏠 Life</MenuItem>
              <MenuItem value="study">📚 Study Zone</MenuItem>
              <MenuItem value="confession">💕 Confession Wall</MenuItem>
              <MenuItem value="treehole">🕳️ Tree Hole</MenuItem>
              <MenuItem value="food">🍜 Food</MenuItem>
              <MenuItem value="travel">✈️ Travel</MenuItem>
              <MenuItem value="haircut">✂️ Haircut</MenuItem>
              <MenuItem value="housing">🏘️ Housing</MenuItem>
              <MenuItem value="materials">📖 Study Materials</MenuItem>
            </TextField>

            <TextField
              label="Title"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              fullWidth
              placeholder="What's your question or topic?"
            />

            <TextField
              label="Content"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              fullWidth
              multiline
              rows={4}
              placeholder="Share your thoughts, ask questions, or start a discussion..."
            />

            <FormControlLabel
              control={
                <Switch
                  checked={newPost.isAnonymous}
                  onChange={(e) => setNewPost({ ...newPost, isAnonymous: e.target.checked })}
                />
              }
              label="Post anonymously"
            />

            {!newPost.isAnonymous && currentUser && (
              <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Posting as: <strong>{currentUser.displayName || currentUser.email || 'Student'}</strong>
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitPost} 
            variant="contained"
            disabled={submitting || !newPost.title.trim() || !newPost.content.trim()}
          >
            {submitting ? <CircularProgress size={20} /> : 'Post'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reply to Post</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Your Reply"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Share your thoughts..."
            />

            <FormControlLabel
              control={
                <Switch
                  checked={replyAnonymous}
                  onChange={(e) => setReplyAnonymous(e.target.checked)}
                />
              }
              label="Reply anonymously"
            />

            {!replyAnonymous && currentUser && (
              <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Replying as: <strong>{currentUser.displayName || currentUser.email || 'Student'}</strong>
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleReply} 
            variant="contained"
            disabled={!replyContent.trim()}
          >
            Reply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Post Detail Dialog with Comments */}
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
              {selectedPost?.title} - Details
            </Typography>
            <IconButton onClick={() => setOpenDetailDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPost && (
            <Stack spacing={3}>
              {/* Original Post */}
              <Paper sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                  <Typography variant="h6">{selectedPost.title}</Typography>
                  <Chip 
                    label={selectedPost.category} 
                    size="small" 
                    sx={{ 
                      bgcolor: getCategoryColor(selectedPost.category),
                      color: 'white',
                      fontSize: '0.7rem'
                    }}
                  />
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  👤 {selectedPost.author} • 📅 {selectedPost.timestamp?.toDate().toLocaleDateString()}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedPost.content}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <LikeIcon fontSize="small" />
                  <Typography variant="caption" color="textSecondary">
                    {selectedPost.likes?.length || 0} likes
                  </Typography>
                </Box>
              </Paper>

              {/* Comments Section */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  💬 Comments ({getCommentsForPost(selectedPost.id).length})
                </Typography>
                
                {/* Existing Comments */}
                <Stack spacing={2} sx={{ mb: 3 }}>
                  {getCommentsForPost(selectedPost.id).map((comment) => (
                    <Paper key={comment.id} sx={{ p: 2 }}>
                      <Box display="flex" justifyContent="between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2">{comment.commenter}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {comment.timestamp?.toDate().toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>{comment.comment}</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleLikeComment(comment.id)}
                          sx={{ 
                            color: comment.likes?.includes(currentUser?.uid || '') ? 'primary.main' : 'action.disabled',
                            '&:hover': { color: 'primary.main' }
                          }}
                        >
                          <LikeIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="caption" color="textSecondary">
                          {comment.likes?.length || 0} likes
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Stack>

                {/* Add New Comment */}
                <Paper sx={{ p: 3, bgcolor: '#f0f8ff' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    💭 Add Your Comment
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Your Comment"
                      value={newComment.comment}
                      onChange={(e) => setNewComment({ ...newComment, comment: e.target.value })}
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Share your thoughts about this post..."
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
                      disabled={!newComment.comment.trim()}
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
    </Box>
  );
};

export default ForumSection;