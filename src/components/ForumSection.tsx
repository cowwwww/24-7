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
  Grid,
  Fab,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
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
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  isAnonymous: boolean;
  category: 'question' | 'idea' | 'discussion';
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

const ForumSection: React.FC = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // New post form
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    author: '',
    isAnonymous: false,
    category: 'discussion' as 'question' | 'idea' | 'discussion',
  });

  // Reply form
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [replyContent, setReplyContent] = useState('');
  const [replyAuthor, setReplyAuthor] = useState('');
  const [replyAnonymous, setReplyAnonymous] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

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
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const postData = {
        ...newPost,
        author: newPost.isAnonymous ? 'Anonymous' : (newPost.author || 'Anonymous Student'),
        timestamp: Timestamp.now(),
        likes: [],
        replies: [],
      };

      await addDoc(collection(db, 'forumPosts'), postData);
      
      setNewPost({
        title: '',
        content: '',
        author: '',
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

  const handleLikePost = async (postId: string) => {
    const userId = 'current_user'; // In a real app, get from auth
    try {
      const postRef = doc(db, 'forumPosts', postId);
      await updateDoc(postRef, {
        likes: arrayUnion(userId)
      });
      loadPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    try {
      const reply = {
        id: Date.now().toString(),
        content: replyContent,
        author: replyAnonymous ? 'Anonymous' : (replyAuthor || 'Anonymous Student'),
        isAnonymous: replyAnonymous,
        timestamp: Timestamp.now(),
        likes: [],
      };

      const postRef = doc(db, 'forumPosts', selectedPostId);
      await updateDoc(postRef, {
        replies: arrayUnion(reply)
      });

      setReplyContent('');
      setReplyAuthor('');
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

  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

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
          📚 Forum
        </Typography>
        <Typography variant="body1" sx={{ color: '#cccccc', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Ask questions, share ideas, discuss
        </Typography>
      </Paper>

      {/* Category Filters */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            label="All"
            variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
            onClick={() => setSelectedCategory('all')}
            sx={{ mb: 1 }}
          />
          <Chip
            icon={<QuestionIcon />}
            label="Questions"
            variant={selectedCategory === 'question' ? 'filled' : 'outlined'}
            onClick={() => setSelectedCategory('question')}
            sx={{ mb: 1 }}
          />
          <Chip
            icon={<IdeaIcon />}
            label="Ideas"
            variant={selectedCategory === 'idea' ? 'filled' : 'outlined'}
            onClick={() => setSelectedCategory('idea')}
            sx={{ mb: 1 }}
          />
          <Chip
            icon={<StudyIcon />}
            label="Discussions"
            variant={selectedCategory === 'discussion' ? 'filled' : 'outlined'}
            onClick={() => setSelectedCategory('discussion')}
            sx={{ mb: 1 }}
          />
        </Stack>
      </Box>

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
        <Grid container spacing={2}>
          {filteredPosts.map((post) => (
            <Grid item xs={12} key={post.id}>
              <Card elevation={2} sx={{ '&:hover': { elevation: 4 } }}>
                <CardContent>
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
                        <Typography variant="h6" component="h3">
                          {post.title}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          {post.isAnonymous ? <AnonymousIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
                          <Typography variant="body2" color="textSecondary">
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
                  <Typography variant="body1" paragraph>
                    {post.content}
                  </Typography>

                  {/* Post Actions */}
                  <Box display="flex" alignItems="center" gap={2}>
                    <Button
                      startIcon={<LikeIcon />}
                      size="small"
                      onClick={() => handleLikePost(post.id)}
                      color={post.likes?.includes('current_user') ? 'primary' : 'inherit'}
                    >
                      {post.likes?.length || 0}
                    </Button>
                    <Button
                      startIcon={<ReplyIcon />}
                      size="small"
                      onClick={() => {
                        setSelectedPostId(post.id);
                        setReplyDialogOpen(true);
                      }}
                    >
                      Reply ({post.replies?.length || 0})
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
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ 
          position: 'fixed', 
          bottom: { xs: 80, md: 16 }, // Higher on mobile to avoid bottom nav
          right: 16,
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

            {!newPost.isAnonymous && (
              <TextField
                label="Your Name (optional)"
                value={newPost.author}
                onChange={(e) => setNewPost({ ...newPost, author: e.target.value })}
                fullWidth
                placeholder="How would you like others to see you?"
              />
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

            {!replyAnonymous && (
              <TextField
                label="Your Name (optional)"
                value={replyAuthor}
                onChange={(e) => setReplyAuthor(e.target.value)}
                fullWidth
                placeholder="How would you like others to see you?"
              />
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
    </Box>
  );
};

export default ForumSection;
