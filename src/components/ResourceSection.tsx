import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
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
  Slider,
  CardMedia,
  Grid,
} from '@mui/material';
import {
  Smartphone as PhoneIcon,
  Laptop as LaptopIcon,
  MenuBook as BookIcon,
  School as StudyIcon,
  SportsEsports as GameIcon,
  Checkroom as ClothingIcon,
  FitnessCenter as SportsIcon,
  DirectionsBike as BikeIcon,
  MoreHoriz as OtherIcon,
  Add as AddIcon,
  AttachMoney as PriceIcon,
  LocationOn as LocationIcon,
  Person as SellerIcon,
  Message as ContactIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Visibility as ViewIcon,
  Image as ImageIcon,
  Star as StarIcon,
  Category as CategoryIcon,
  Bookmark as BookmarkedIcon,
  BookmarkBorder as BookmarkIcon,
  Link as LinkIcon,
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

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  category: string;
  tags: string[];
  location: string;
  sellerName: string;
  sellerContact: string;
  images: string[];
  views: number;
  bookmarks: string[];
  timestamp: Timestamp;
  verified: boolean;
  available: boolean;
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

interface MarketplaceSectionProps {
  highlightedPostId?: string | null;
}

const MarketplaceSection: React.FC<MarketplaceSectionProps> = ({ highlightedPostId }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [priceRange, setPriceRange] = useState<{min: number, max: number}>({min: 0, max: 1000});
  const [bookmarkedItems, setBookmarkedItems] = useState<string[]>([]);

  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    price: 0,
    condition: '' as 'new' | 'like-new' | 'good' | 'fair' | 'poor' | '',
    category: '',
    tags: [] as string[],
    location: '',
    sellerName: '',
    sellerContact: '',
    images: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');

  const conditions = [
    { id: 'new', label: '全新 New', color: '#4caf50' },
    { id: 'like-new', label: '九成新 Like New', color: '#8bc34a' },
    { id: 'good', label: '八成新 Good', color: '#ffc107' },
    { id: 'fair', label: '七成新 Fair', color: '#ff9800' },
    { id: 'poor', label: '六成新 Poor', color: '#f44336' },
  ];

  const categories = [
    { id: 'electronics', label: '📱 电子产品 Electronics', icon: <PhoneIcon />, color: '#1976d2' },
    { id: 'books', label: '📚 教材书籍 Books & Textbooks', icon: <BookIcon />, color: '#4caf50' },
    { id: 'clothing', label: '👕 服装鞋帽 Clothing & Shoes', icon: <ClothingIcon />, color: '#e91e63' },
    { id: 'sports', label: '🏃 运动用品 Sports & Fitness', icon: <SportsIcon />, color: '#ff9800' },
    { id: 'furniture', label: '🪑 家具家电 Furniture & Appliances', icon: <BikeIcon />, color: '#9c27b0' },
    { id: 'stationery', label: '✏️ 文具用品 Stationery', icon: <StudyIcon />, color: '#607d8b' },
    { id: 'games', label: '🎮 游戏娱乐 Games & Entertainment', icon: <GameIcon />, color: '#795548' },
    { id: 'other', label: '🔹 其他 Others', icon: <OtherIcon />, color: '#666666' },
  ];

  // Sample marketplace items
  const sampleItems = [
    {
      title: '微积分教科书 Calculus Textbook',
      description: 'Stewart 第8版，几乎全新，笔记很少 Stewart 8th edition, almost new with minimal notes',
      price: 80,
      condition: 'like-new' as const,
      category: 'study-materials',
      tags: ['数学', 'math', '教科书', 'textbook'],
      location: '校园内 On Campus',
      sellerName: '李同学 Li Student',
      sellerContact: 'WeChat: li_student123',
      images: [],
    },
    {
      title: '宿舍床垫 Dorm Mattress',
      description: '单人床垫，使用一年，很舒适 Single mattress, used for 1 year, very comfortable',
      price: 150,
      condition: 'good' as const,
      category: 'furniture',
      tags: ['床垫', 'mattress', '宿舍', 'dorm'],
      location: '学生公寓 Student Apartment',
      sellerName: '张同学 Zhang Student',
      sellerContact: 'Email: zhang@student.edu',
      images: [],
    },
    {
      title: 'MacBook Pro 2020',
      description: 'M1芯片，256GB存储，轻微使用痕迹 M1 chip, 256GB storage, minimal wear',
      price: 800,
      condition: 'good' as const,
      category: 'electronics',
      tags: ['笔记本', 'laptop', 'Apple', 'MacBook'],
      location: '图书馆附近 Near Library',
      sellerName: '王同学 Wang Student',
      sellerContact: 'Phone: +1-xxx-xxx-xxxx',
      images: [],
    },
    {
      title: '冬季外套 Winter Jacket',
      description: '北脸牌，中号，保暖性很好 North Face, size M, very warm',
      price: 45,
      condition: 'good' as const,
      category: 'clothing',
      tags: ['外套', 'jacket', '冬季', 'winter'],
      location: '校园商店 Campus Store',
      sellerName: '陈同学 Chen Student',
      sellerContact: 'WeChat: chen_winter',
      images: [],
    },
  ];

  useEffect(() => {
    loadItems();
    initializeSampleItems();
  }, []);

  const initializeSampleItems = async () => {
    try {
      // Check if items already exist
      const itemsRef = collection(db, 'marketplace-items');
      const snapshot = await getDocs(itemsRef);
      
      if (snapshot.empty) {
        // Add sample items if none exist
        for (const item of sampleItems) {
          await addDoc(itemsRef, {
            ...item,
            views: Math.floor(Math.random() * 50),
            bookmarks: [],
            timestamp: Timestamp.now(),
            verified: true,
            available: true,
          });
        }
        loadItems();
      }
    } catch (error) {
      console.error('Error initializing sample items:', error);
    }
  };

  const loadItems = async () => {
    try {
      const itemsRef = collection(db, 'marketplace-items');
      const q = query(itemsRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MarketplaceItem[];
      
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitItem = async () => {
    if (!newItem.title.trim() || !newItem.category || !newItem.condition || newItem.price <= 0) {
      return;
    }

    try {
      const itemData = {
        ...newItem,
        sellerName: newItem.sellerName || 'Anonymous Student',
        views: 0,
        bookmarks: [],
        timestamp: Timestamp.now(),
        verified: false,
        available: true,
      };

      await addDoc(collection(db, 'marketplace-items'), itemData);
      
      setNewItem({
        title: '',
        description: '',
        price: 0,
        condition: '' as 'new' | 'like-new' | 'good' | 'fair' | 'poor' | '',
        category: '',
        tags: [],
        location: '',
        sellerName: '',
        sellerContact: '',
        images: [],
      });
      setOpenDialog(false);
      loadItems();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !newItem.tags.includes(tagInput.trim())) {
      setNewItem({
        ...newItem,
        tags: [...newItem.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setNewItem({
      ...newItem,
      tags: newItem.tags.filter(t => t !== tag)
    });
  };

  const handleBookmark = async (itemId: string) => {
    const userId = 'current_user'; // In a real app, get from auth
    try {
      const itemRef = doc(db, 'marketplace-items', itemId);
      
      if (bookmarkedItems.includes(itemId)) {
        await updateDoc(itemRef, {
          bookmarks: arrayRemove(userId)
        });
        setBookmarkedItems(prev => prev.filter(id => id !== itemId));
      } else {
        await updateDoc(itemRef, {
          bookmarks: arrayUnion(userId)
        });
        setBookmarkedItems(prev => [...prev, itemId]);
      }
      
      loadItems();
    } catch (error) {
      console.error('Error bookmarking item:', error);
    }
  };

  const handleViewItem = async (item: MarketplaceItem) => {
    try {
      const itemRef = doc(db, 'marketplace-items', item.id);
      await updateDoc(itemRef, {
        views: item.views + 1
      });
      
      loadItems();
    } catch (error) {
      console.error('Error updating views:', error);
    }
  };

  const getFilteredItems = (category?: string) => {
    let filtered = items;

    if (category) {
      filtered = filtered.filter(item => item.category === category);
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.sellerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (selectedCondition) {
      filtered = filtered.filter(item => item.condition === selectedCondition);
    }

    // Price range filter
    filtered = filtered.filter(item => 
      item.price >= priceRange.min && item.price <= priceRange.max
    );

    // Only show available items
    filtered = filtered.filter(item => item.available);

    return filtered;
  };

  const getPopularItems = () => {
    return items
      .filter(item => item.available)
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);
  };

  const getBookmarkedItems = () => {
    return items.filter(item => 
      item.bookmarks.includes('current_user') && item.available
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

  const getConditionInfo = (conditionId: string) => {
    const condition = conditions.find(cond => cond.id === conditionId);
    return condition || { id: conditionId, label: conditionId, color: '#9e9e9e' };
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
          🛍️ 二手市场 Marketplace
        </Typography>
        <Typography variant="body1" sx={{ color: '#cccccc', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          买卖二手物品的学生平台 Student platform for buying & selling second-hand items
        </Typography>
      </Paper>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="搜索物品... Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
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
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Condition</InputLabel>
              <Select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                label="Condition"
              >
                <MenuItem value="">All Conditions</MenuItem>
                {conditions.map(condition => (
                  <MenuItem key={condition.id} value={condition.id}>
                    {condition.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Box sx={{ px: 2 }}>
              <Typography variant="body2" gutterBottom>
                Price Range: ${priceRange.min} - ${priceRange.max}
              </Typography>
              <Slider
                value={[priceRange.min, priceRange.max]}
                onChange={(e, newValue) => setPriceRange({
                  min: (newValue as number[])[0],
                  max: (newValue as number[])[1]
                })}
                valueLabelDisplay="auto"
                min={0}
                max={1000}
                step={10}
                size="small"
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={1}>
            <Typography variant="body2" color="textSecondary" textAlign="center">
              {getFilteredItems().length} items
            </Typography>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              fullWidth
            >
              Sell Item
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
          <Tab icon={<StarIcon />} label="热门 Popular" iconPosition="start" />
          <Tab icon={<CategoryIcon />} label="分类浏览 By Category" iconPosition="start" />
          <Tab icon={<BookmarkedIcon />} label="我的收藏 My Saved" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={currentTab} index={0}>
        {/* Popular Items */}
        <Typography variant="h6" gutterBottom>
          🔥 热门商品 Most Viewed Items
        </Typography>
        <Grid container spacing={2}>
          {getPopularItems().map((item) => (
            <Grid item xs={12} md={6} lg={4} key={item.id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box flexGrow={1}>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {item.title}
                      </Typography>
                      <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                        ${item.price}
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={() => handleBookmark(item.id)}
                      color={item.bookmarks.includes('current_user') ? 'primary' : 'default'}
                    >
                      {item.bookmarks.includes('current_user') ? <BookmarkedIcon /> : <BookmarkIcon />}
                    </IconButton>
                  </Box>

                  <Typography variant="body2" color="textSecondary" paragraph>
                    {item.description}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip
                      label={getConditionInfo(item.condition).label}
                      size="small"
                      sx={{ bgcolor: getConditionInfo(item.condition).color, color: 'white' }}
                    />
                    <Chip
                      label={categories.find(cat => cat.id === item.category)?.label || item.category}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="textSecondary">
                      {item.location}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <SellerIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="textSecondary">
                      {item.sellerName}
                    </Typography>
                    <Chip
                      icon={<ViewIcon />}
                      label={`${item.views} views`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  {item.tags.length > 0 && (
                    <Box>
                      {item.tags.slice(0, 3).map((tag) => (
                        <Chip
                          key={tag}
                          label={`#${tag}`}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  <Button
                    startIcon={<ContactIcon />}
                    onClick={() => handleViewItem(item)}
                    fullWidth
                    variant="contained"
                    sx={{ bgcolor: getCategoryColor(item.category) }}
                  >
                    联系卖家 Contact Seller
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
          const categoryItems = getFilteredItems(category.id);
          
          if (categoryItems.length === 0) return null;

          return (
            <Box key={category.id} mb={4}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {category.icon}
                {category.label} ({categoryItems.length})
              </Typography>
              
              <Grid container spacing={2}>
                {categoryItems.slice(0, 6).map((item) => (
                  <Grid item xs={12} md={6} lg={4} key={item.id}>
                    <Card elevation={1} sx={{ height: '100%' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                          <Box flexGrow={1}>
                            <Typography variant="h6" component="h3" gutterBottom>
                              {item.title}
                            </Typography>
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                              ${item.price}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleBookmark(item.id)}
                            color={item.bookmarks.includes('current_user') ? 'primary' : 'default'}
                          >
                            {item.bookmarks.includes('current_user') ? <BookmarkedIcon /> : <BookmarkIcon />}
                          </IconButton>
                        </Box>
                        
                        <Typography variant="body2" color="textSecondary" paragraph>
                          {item.description}
                        </Typography>

                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Chip
                            label={getConditionInfo(item.condition).label}
                            size="small"
                            sx={{ bgcolor: getConditionInfo(item.condition).color, color: 'white' }}
                          />
                          <Chip
                            icon={<ViewIcon />}
                            label={`${item.views} views`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>

                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="textSecondary">
                            {item.location}
                          </Typography>
                        </Box>

                        <Button
                          startIcon={<ContactIcon />}
                          onClick={() => handleViewItem(item)}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: category.color, color: category.color }}
                        >
                          Contact
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              {categoryItems.length > 6 && (
                <Box textAlign="center" mt={2}>
                  <Button variant="outlined" size="small">
                    View all {categoryItems.length} items
                  </Button>
                </Box>
              )}
            </Box>
          );
        })}
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {/* Bookmarked Items */}
        {getBookmarkedItems().length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              还没有收藏的商品 No saved items yet
            </Typography>
            <Typography variant="body2" color="textSecondary">
              开始收藏感兴趣的商品，方便以后查找！Start saving items you're interested in!
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {getBookmarkedItems().map((item) => (
              <Grid item xs={12} md={6} lg={4} key={item.id}>
                <Card elevation={2}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Box flexGrow={1}>
                        <Typography variant="h6" gutterBottom>
                          {item.title}
                        </Typography>
                        <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                          ${item.price}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: getCategoryColor(item.category) }}>
                        {getCategoryIcon(item.category)}
                      </Avatar>
                    </Box>

                    <Typography variant="body2" color="textSecondary" paragraph>
                      {item.description}
                    </Typography>

                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Chip
                        label={getConditionInfo(item.condition).label}
                        size="small"
                        sx={{ bgcolor: getConditionInfo(item.condition).color, color: 'white' }}
                      />
                    </Box>

                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="textSecondary">
                        {item.location}
                      </Typography>
                    </Box>

                    <Button
                      startIcon={<ContactIcon />}
                      onClick={() => handleViewItem(item)}
                      variant="contained"
                      fullWidth
                      sx={{ bgcolor: getCategoryColor(item.category) }}
                    >
                      联系卖家 Contact Seller
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Add Item Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>出售物品 Sell Item</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="物品名称 Item Title"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              fullWidth
              required
              placeholder="e.g., 微积分教科书, MacBook Pro, 宿舍床垫..."
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="价格 Price ($)"
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                  fullWidth
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>物品状况 Condition</InputLabel>
                  <Select
                    value={newItem.condition}
                    onChange={(e) => setNewItem({ ...newItem, condition: e.target.value as any })}
                    label="物品状况 Condition"
                  >
                    {conditions.map(condition => (
                      <MenuItem key={condition.id} value={condition.id}>
                        {condition.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              label="详细描述 Description"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="详细描述物品的状况、使用时间、购买原因等... Describe the item condition, usage time, etc..."
            />

            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
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

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="位置 Location"
                  value={newItem.location}
                  onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                  fullWidth
                  placeholder="e.g., 校园内, 宿舍楼下, On campus..."
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="联系方式 Contact"
                  value={newItem.sellerContact}
                  onChange={(e) => setNewItem({ ...newItem, sellerContact: e.target.value })}
                  fullWidth
                  placeholder="e.g., WeChat: xxx, Email: xxx"
                />
              </Grid>
            </Grid>

            <Box>
              <Typography variant="subtitle2" gutterBottom>标签 Tags</Typography>
              <Box display="flex" gap={1} mb={1}>
                <TextField
                  size="small"
                  placeholder="添加标签 Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag}>Add</Button>
              </Box>
              <Box>
                {newItem.tags.map((tag) => (
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
              label="您的姓名 Your Name (Optional)"
              value={newItem.sellerName}
              onChange={(e) => setNewItem({ ...newItem, sellerName: e.target.value })}
              fullWidth
              placeholder="您希望如何称呼？How would you like to be called?"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>取消 Cancel</Button>
          <Button 
            onClick={handleSubmitItem} 
            variant="contained"
            disabled={!newItem.title.trim() || !newItem.category || !newItem.condition || newItem.price <= 0}
          >
            发布商品 Post Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MarketplaceSection;
