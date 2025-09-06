import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Chip,
  Avatar,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
  Rating,
  Badge,
  IconButton,
  Tab,
  Tabs,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  MonetizationOn as MoneyIcon,
  Star as StarIcon,
  Chat as ChatIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Verified as VerifiedIcon,
  Psychology as TutorIcon,
  Code as CodingIcon,
  Language as LanguageIcon,
  Calculate as MathIcon,
  Science as ScienceIcon,
  Business as BusinessIcon,
  LocalHospital as MedicalIcon,
  Engineering as EngineeringIcon,
  Build as RepairIcon,
  DesignServices as DesignIcon,
  MusicNote as MusicIcon,
  FitnessCenter as FitnessIcon,
  Restaurant as FoodServiceIcon,
  HomeRepairService as HomeServiceIcon,
  Computer as TechIcon,
  Psychology as CounselingIcon,
} from '@mui/icons-material';
import { 
  collection, 
  addDoc, 
  getDocs, 
  orderBy, 
  query, 
  Timestamp,
  where 
} from 'firebase/firestore';
import { db } from '../firebase';

interface UserRating {
  id: string;
  raterId: string;
  raterName: string;
  rating: number;
  comment: string;
  timestamp: Timestamp;
}

interface StudentProfile {
  id: string;
  name: string;
  major: string;
  year: number;
  hobbies: string[];
  bio: string;
  skills: string[];
  contactDetails: {
    email: string;
    phone?: string;
    preferredContact: 'email' | 'phone' | 'both';
  };
  helpOffering: {
    isOffering: boolean;
    subjects: string[];
    pricePerHour: number;
    description: string;
    rating: number;
    completedSessions: number;
  };
  ratings: UserRating[];
  avatar?: string;
  verified: boolean;
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
      id={`connection-tabpanel-${index}`}
      aria-labelledby={`connection-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const ConnectionSection: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [priceRange, setPriceRange] = useState('');

  const [newProfile, setNewProfile] = useState({
    name: '',
    major: '',
    year: 1,
    bio: '',
    hobbies: [] as string[],
    skills: [] as string[],
    contactDetails: {
      email: '',
      phone: '',
      preferredContact: 'email' as 'email' | 'phone' | 'both',
    },
    helpOffering: {
      isOffering: false,
      subjects: [] as string[],
      pricePerHour: 0,
      description: '',
    },
    ratings: [] as UserRating[],
  });

  const [hobbyInput, setHobbyInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedProfileForRating, setSelectedProfileForRating] = useState<StudentProfile | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingComment, setRatingComment] = useState('');
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedProfileForContact, setSelectedProfileForContact] = useState<StudentProfile | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedProfileForComment, setSelectedProfileForComment] = useState<StudentProfile | null>(null);
  const [newComment, setNewComment] = useState('');
  const [newCommentRating, setNewCommentRating] = useState<number | null>(null);

  const majors = [
    'Computer Science', 'Engineering', 'Business', 'Mathematics', 'Physics',
    'Chemistry', 'Biology', 'Psychology', 'English', 'History', 'Art', 'Music'
  ];

  const popularSkills = [
    'Programming', 'Mathematics', 'Writing', 'Languages', 'Design',
    'Music', 'Sports', 'Cooking', 'Photography', 'Tutoring'
  ];

  const getSkillIcon = (skill: string) => {
    if (skill.toLowerCase().includes('programming') || skill.toLowerCase().includes('coding')) return <CodingIcon />;
    if (skill.toLowerCase().includes('math')) return <MathIcon />;
    if (skill.toLowerCase().includes('language')) return <LanguageIcon />;
    if (skill.toLowerCase().includes('science')) return <ScienceIcon />;
    if (skill.toLowerCase().includes('business')) return <BusinessIcon />;
    return <StarIcon />;
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const profilesRef = collection(db, 'studentProfiles');
      const q = query(profilesRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      const profilesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudentProfile[];
      
      setProfiles(profilesData);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProfile = async () => {
    if (!newProfile.name.trim() || !newProfile.major.trim() || !newProfile.contactDetails.email.trim()) {
      return;
    }

    try {
      const profileData = {
        ...newProfile,
        helpOffering: {
          ...newProfile.helpOffering,
          rating: 5.0,
          completedSessions: 0,
        },
        ratings: [],
        verified: false,
        timestamp: Timestamp.now(),
      };

      await addDoc(collection(db, 'studentProfiles'), profileData);
      
      setNewProfile({
        name: '',
        major: '',
        year: 1,
        bio: '',
        hobbies: [],
        skills: [],
        contactDetails: {
          email: '',
          phone: '',
          preferredContact: 'email',
        },
        helpOffering: {
          isOffering: false,
          subjects: [],
          pricePerHour: 0,
          description: '',
        },
        ratings: [],
      });
      setOpenDialog(false);
      loadProfiles();
    } catch (error) {
      console.error('Error adding profile:', error);
    }
  };

  const addHobby = () => {
    if (hobbyInput.trim() && !newProfile.hobbies.includes(hobbyInput.trim())) {
      setNewProfile({
        ...newProfile,
        hobbies: [...newProfile.hobbies, hobbyInput.trim()]
      });
      setHobbyInput('');
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !newProfile.skills.includes(skillInput.trim())) {
      setNewProfile({
        ...newProfile,
        skills: [...newProfile.skills, skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  const addSubject = () => {
    if (subjectInput.trim() && !newProfile.helpOffering.subjects.includes(subjectInput.trim())) {
      setNewProfile({
        ...newProfile,
        helpOffering: {
          ...newProfile.helpOffering,
          subjects: [...newProfile.helpOffering.subjects, subjectInput.trim()]
        }
      });
      setSubjectInput('');
    }
  };

  const removeItem = (array: string[], item: string, field: string) => {
    if (field === 'hobbies') {
      setNewProfile({
        ...newProfile,
        hobbies: array.filter(h => h !== item)
      });
    } else if (field === 'skills') {
      setNewProfile({
        ...newProfile,
        skills: array.filter(s => s !== item)
      });
    } else if (field === 'subjects') {
      setNewProfile({
        ...newProfile,
        helpOffering: {
          ...newProfile.helpOffering,
          subjects: array.filter(s => s !== item)
        }
      });
    }
  };

  const getFilteredProfiles = () => {
    let filtered = profiles;

    if (searchTerm) {
      filtered = filtered.filter(profile =>
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.major.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
        profile.helpOffering.subjects.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedMajor) {
      filtered = filtered.filter(profile => profile.major === selectedMajor);
    }

    if (selectedSkill) {
      filtered = filtered.filter(profile => 
        profile.skills.includes(selectedSkill) || 
        profile.helpOffering.subjects.includes(selectedSkill)
      );
    }

    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      filtered = filtered.filter(profile => {
        if (!profile.helpOffering.isOffering) return true;
        const price = profile.helpOffering.pricePerHour;
        return price >= min && (max ? price <= max : true);
      });
    }

    return filtered;
  };

  const getTutors = () => {
    return profiles.filter(profile => profile.helpOffering.isOffering);
  };

  const handleConnectClick = (profile: StudentProfile) => {
    setSelectedProfileForRating(profile);
    setRatingDialogOpen(true);
  };

  const handleContactClick = (profile: StudentProfile) => {
    setSelectedProfileForContact(profile);
    setContactDialogOpen(true);
  };

  const handleCommentClick = (profile: StudentProfile) => {
    setSelectedProfileForComment(profile);
    setCommentDialogOpen(true);
  };

  const handleSubmitComment = () => {
    if (newCommentRating && newCommentRating > 0 && newComment.trim()) {
      // Here you would typically save the comment to your database
      console.log('Comment submitted:', {
        profileId: selectedProfileForComment?.id,
        rating: newCommentRating,
        comment: newComment
      });
      
      // Close dialog and reset
      setCommentDialogOpen(false);
      setNewCommentRating(null);
      setNewComment('');
      setSelectedProfileForComment(null);
      
      // Show success message
      alert('Thank you for your comment! Your feedback has been submitted.');
    }
  };

  const handleSubmitRating = () => {
    if (userRating && userRating > 0) {
      // Here you would typically save the rating to your database
      console.log('Rating submitted:', {
        profileId: selectedProfileForRating?.id,
        rating: userRating,
        comment: ratingComment
      });
      
      // Close dialog and reset
      setRatingDialogOpen(false);
      setUserRating(null);
      setRatingComment('');
      setSelectedProfileForRating(null);
      
      // Show success message or proceed with connection
      alert('Thank you for your rating! You can now connect with this student.');
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
            🤝 Connections
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: '#cccccc', fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 2 }}>
          Connect with students, find tutors, and build your network
        </Typography>
        
        {/* Integrated Search Bar */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search students, tutors, or subjects..."
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
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<PersonIcon />} label="All Students" iconPosition="start" />
          <Tab icon={<TutorIcon />} label="Tutoring" iconPosition="start" />
          <Tab icon={<MedicalIcon />} label="Medical" iconPosition="start" />
          <Tab icon={<EngineeringIcon />} label="Engineering" iconPosition="start" />
          <Tab icon={<TechIcon />} label="Tech Support" iconPosition="start" />
          <Tab icon={<DesignIcon />} label="Design" iconPosition="start" />
          <Tab icon={<MusicIcon />} label="Music" iconPosition="start" />
          <Tab icon={<FitnessIcon />} label="Fitness" iconPosition="start" />
          <Tab icon={<FoodServiceIcon />} label="Food Service" iconPosition="start" />
          <Tab icon={<HomeServiceIcon />} label="Home Services" iconPosition="start" />
          <Tab icon={<CounselingIcon />} label="Counseling" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box sx={{ flex: '0 0 160px', minWidth: 160 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Major</InputLabel>
              <Select
                value={selectedMajor}
                onChange={(e) => setSelectedMajor(e.target.value)}
                label="Major"
                sx={{ 
                  '& .MuiSelect-select': { 
                    paddingRight: '32px !important',
                    minWidth: 'fit-content',
                    whiteSpace: 'nowrap'
                  } 
                }}
              >
                <MenuItem value="">All Majors</MenuItem>
                {majors.map(major => (
                  <MenuItem key={major} value={major}>{major}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '0 0 160px', minWidth: 160 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Skills</InputLabel>
              <Select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                label="Skills"
                sx={{ 
                  '& .MuiSelect-select': { 
                    paddingRight: '32px !important',
                    minWidth: 'fit-content',
                    whiteSpace: 'nowrap'
                  } 
                }}
              >
                <MenuItem value="">All Skills</MenuItem>
                {popularSkills.map(skill => (
                  <MenuItem key={skill} value={skill}>{skill}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {currentTab === 1 && (
            <Box sx={{ flex: '0 0 180px', minWidth: 180 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Price Range</InputLabel>
                <Select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  label="Price Range"
                  sx={{ 
                    '& .MuiSelect-select': { 
                      paddingRight: '32px !important',
                      minWidth: 'fit-content',
                      whiteSpace: 'nowrap'
                    } 
                  }}
                >
                  <MenuItem value="">Any Price</MenuItem>
                  <MenuItem value="0-10">$0-10/hour</MenuItem>
                  <MenuItem value="10-20">$10-20/hour</MenuItem>
                  <MenuItem value="20-30">$20-30/hour</MenuItem>
                  <MenuItem value="30-">$30+/hour</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
          <Box sx={{ flex: '0 0 180px', minWidth: 180 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              fullWidth
            >
              Create Profile
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={currentTab} index={0}>
        {/* All Students */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {getFilteredProfiles().map((profile) => (
            <Box key={profile.id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={profile.verified ? <VerifiedIcon color="primary" fontSize="small" /> : null}
                    >
                      <Avatar sx={{ width: 48, height: 48, bgcolor: '#000000' }}>
                        {profile.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                    </Badge>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>{profile.name}</Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ wordBreak: 'break-word' }}>
                        {profile.major} • Year {profile.year}
                      </Typography>
                    </Box>
                  </Box>

                  {profile.bio && (
                    <Typography variant="body2" paragraph>
                      {profile.bio}
                    </Typography>
                  )}

                  {profile.hobbies.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="caption" color="textSecondary">
                        Hobbies:
                      </Typography>
                      <Box mt={0.5}>
                        {profile.hobbies.slice(0, 3).map((hobby) => (
                          <Chip
                            key={hobby}
                            label={hobby}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
                          />
                        ))}
                        {profile.hobbies.length > 3 && (
                          <Typography variant="caption" color="textSecondary">
                            +{profile.hobbies.length - 3} more
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}

                  {profile.skills.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="caption" color="textSecondary">
                        Skills:
                      </Typography>
                      <Box mt={0.5} sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {profile.skills.map((skill) => (
                          <Chip
                            key={skill}
                            icon={getSkillIcon(skill)}
                            label={skill}
                            size="small"
                            sx={{ 
                              fontSize: '0.75rem',
                              minWidth: 'fit-content',
                              whiteSpace: 'nowrap',
                              '& .MuiChip-label': {
                                whiteSpace: 'nowrap',
                                overflow: 'visible'
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {profile.helpOffering.isOffering && (
                  <Paper sx={{ p: 2, bgcolor: '#f5f5f5', border: '1px solid #000000', mb: 2 }}>
                    <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
                      💡 Offering Help:
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {profile.helpOffering.subjects.join(', ')}
                      </Typography>
                    </Box>
                    <Typography variant="h6" color="primary" fontWeight="bold" sx={{ whiteSpace: 'nowrap' }}>
                      ${profile.helpOffering.pricePerHour}/hour
                    </Typography>
                    </Paper>
                  )}

                  {/* Ratings and Comments Section */}
                  {profile.ratings && profile.ratings.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="caption" color="textSecondary" gutterBottom>
                        Recent Reviews:
                      </Typography>
                      <Box sx={{ maxHeight: '120px', overflowY: 'auto' }}>
                        {profile.ratings.slice(0, 2).map((rating) => (
                          <Paper key={rating.id} sx={{ p: 1, mb: 1, bgcolor: '#f9f9f9' }}>
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                              <Rating value={rating.rating} readOnly size="small" />
                              <Typography variant="caption" color="textSecondary">
                                by {rating.raterName}
                              </Typography>
                            </Box>
                            {rating.comment && (
                              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                "{rating.comment}"
                              </Typography>
                            )}
                          </Paper>
                        ))}
                        {profile.ratings.length > 2 && (
                          <Typography variant="caption" color="textSecondary">
                            +{profile.ratings.length - 2} more reviews
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<StarIcon />}
                    onClick={() => handleCommentClick(profile)}
                    color="primary"
                  >
                    Rate & Comment
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<PersonIcon />}
                    onClick={() => handleContactClick(profile)}
                    color="secondary"
                  >
                    Contact Info
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {/* Tutors */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {getTutors().filter(profile => {
            if (searchTerm) {
              return profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     profile.helpOffering.subjects.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase()));
            }
            if (selectedMajor && profile.major !== selectedMajor) return false;
            if (priceRange) {
              const [min, max] = priceRange.split('-').map(Number);
              const price = profile.helpOffering.pricePerHour;
              if (!(price >= min && (max ? price <= max : true))) return false;
            }
            return true;
          }).map((profile) => (
            <Box key={profile.id}>
              <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={<TutorIcon color="primary" fontSize="small" />}
                    >
                      <Avatar sx={{ width: 48, height: 48, bgcolor: '#000000' }}>
                        {profile.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                    </Badge>
                    <Box>
                      <Typography variant="h6">{profile.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {profile.major} • Year {profile.year}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Rating value={profile.helpOffering.rating} readOnly size="small" />
                        <Typography variant="caption">
                          ({profile.helpOffering.completedSessions} sessions)
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mb: 2 }}>
                  <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom sx={{ whiteSpace: 'nowrap' }}>
                    ${profile.helpOffering.pricePerHour}/hour
                  </Typography>
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Subjects:
                    </Typography>
                    <Box mb={1} sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {profile.helpOffering.subjects.map((subject) => (
                        <Chip
                          key={subject}
                          label={subject}
                          size="small"
                          color="primary"
                          sx={{ 
                            minWidth: 'fit-content',
                            whiteSpace: 'nowrap',
                            '& .MuiChip-label': {
                              whiteSpace: 'nowrap',
                              overflow: 'visible'
                            }
                          }}
                        />
                      ))}
                    </Box>

                    {profile.helpOffering.description && (
                      <>
                        <Typography variant="subtitle2" gutterBottom>
                          About:
                        </Typography>
                        <Typography variant="body2">
                          {profile.helpOffering.description}
                        </Typography>
                      </>
                    )}
                  </Paper>

                  {profile.skills.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Additional Skills:
                      </Typography>
                      <Box mt={0.5} sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {profile.skills.map((skill) => (
                          <Chip
                            key={skill}
                            label={skill}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.75rem',
                              minWidth: 'fit-content',
                              whiteSpace: 'nowrap',
                              '& .MuiChip-label': {
                                whiteSpace: 'nowrap',
                                overflow: 'visible'
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<StarIcon />}
                    onClick={() => handleCommentClick(profile)}
                    color="primary"
                  >
                    Rate & Comment
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<PersonIcon />}
                    onClick={() => handleContactClick(profile)}
                    color="secondary"
                  >
                    Contact Info
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>

        {getTutors().length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No tutors available yet
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Be the first to offer your knowledge and help fellow students!
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Become a Tutor
            </Button>
          </Paper>
        )}
      </TabPanel>

      {/* Medical Services Tab */}
      <TabPanel value={currentTab} index={2}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {getFilteredProfiles().filter(profile => 
            profile.helpOffering.isOffering && 
            profile.helpOffering.subjects.some(subject => 
              ['medical', 'health', 'nursing', 'biology', 'anatomy', 'physiology'].some(medical => 
                subject.toLowerCase().includes(medical)
              )
            )
          ).map((profile) => (
            <Box key={profile.id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <MedicalIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h3">
                        {profile.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {profile.major} • {profile.year}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" paragraph>
                    {profile.bio}
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Medical Services:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {profile.helpOffering.subjects.filter(subject => 
                        ['medical', 'health', 'nursing', 'biology', 'anatomy', 'physiology'].some(medical => 
                          subject.toLowerCase().includes(medical)
                        )
                      ).map((subject) => (
                        <Chip key={subject} label={subject} size="small" color="primary" />
                      ))}
                    </Box>
                  </Box>
                  <Typography variant="h6" color="primary">
                    ${profile.helpOffering.pricePerHour}/hour
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    startIcon={<ChatIcon />}
                    onClick={() => handleConnectClick(profile)}
                    fullWidth
                  >
                    Connect
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      </TabPanel>

      {/* Engineering Services Tab */}
      <TabPanel value={currentTab} index={3}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {getFilteredProfiles().filter(profile => 
            profile.helpOffering.isOffering && 
            profile.helpOffering.subjects.some(subject => 
              ['engineering', 'mechanical', 'electrical', 'civil', 'computer', 'software', 'programming'].some(eng => 
                subject.toLowerCase().includes(eng)
              )
            )
          ).map((profile) => (
            <Box key={profile.id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <EngineeringIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h3">
                        {profile.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {profile.major} • {profile.year}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" paragraph>
                    {profile.bio}
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Engineering Services:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {profile.helpOffering.subjects.filter(subject => 
                        ['engineering', 'mechanical', 'electrical', 'civil', 'computer', 'software', 'programming'].some(eng => 
                          subject.toLowerCase().includes(eng)
                        )
                      ).map((subject) => (
                        <Chip key={subject} label={subject} size="small" color="primary" />
                      ))}
                    </Box>
                  </Box>
                  <Typography variant="h6" color="primary">
                    ${profile.helpOffering.pricePerHour}/hour
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    startIcon={<ChatIcon />}
                    onClick={() => handleConnectClick(profile)}
                    fullWidth
                  >
                    Connect
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      </TabPanel>

      {/* Tech Support Tab */}
      <TabPanel value={currentTab} index={4}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {getFilteredProfiles().filter(profile => 
            profile.helpOffering.isOffering && 
            profile.helpOffering.subjects.some(subject => 
              ['tech', 'computer', 'software', 'hardware', 'programming', 'coding', 'web', 'app'].some(tech => 
                subject.toLowerCase().includes(tech)
              )
            )
          ).map((profile) => (
            <Box key={profile.id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <TechIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h3">
                        {profile.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {profile.major} • {profile.year}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" paragraph>
                    {profile.bio}
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Tech Services:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {profile.helpOffering.subjects.filter(subject => 
                        ['tech', 'computer', 'software', 'hardware', 'programming', 'coding', 'web', 'app'].some(tech => 
                          subject.toLowerCase().includes(tech)
                        )
                      ).map((subject) => (
                        <Chip key={subject} label={subject} size="small" color="primary" />
                      ))}
                    </Box>
                  </Box>
                  <Typography variant="h6" color="primary">
                    ${profile.helpOffering.pricePerHour}/hour
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    startIcon={<ChatIcon />}
                    onClick={() => handleConnectClick(profile)}
                    fullWidth
                  >
                    Connect
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      </TabPanel>

      {/* Design Services Tab */}
      <TabPanel value={currentTab} index={5}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {getFilteredProfiles().filter(profile => 
            profile.helpOffering.isOffering && 
            profile.helpOffering.subjects.some(subject => 
              ['design', 'graphic', 'ui', 'ux', 'art', 'creative', 'photoshop', 'illustrator'].some(design => 
                subject.toLowerCase().includes(design)
              )
            )
          ).map((profile) => (
            <Box key={profile.id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <DesignIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h3">
                        {profile.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {profile.major} • {profile.year}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" paragraph>
                    {profile.bio}
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Design Services:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {profile.helpOffering.subjects.filter(subject => 
                        ['design', 'graphic', 'ui', 'ux', 'art', 'creative', 'photoshop', 'illustrator'].some(design => 
                          subject.toLowerCase().includes(design)
                        )
                      ).map((subject) => (
                        <Chip key={subject} label={subject} size="small" color="primary" />
                      ))}
                    </Box>
                  </Box>
                  <Typography variant="h6" color="primary">
                    ${profile.helpOffering.pricePerHour}/hour
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    startIcon={<ChatIcon />}
                    onClick={() => handleConnectClick(profile)}
                    fullWidth
                  >
                    Connect
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      </TabPanel>

      {/* Music Services Tab */}
      <TabPanel value={currentTab} index={6}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {getFilteredProfiles().filter(profile => 
            profile.helpOffering.isOffering && 
            profile.helpOffering.subjects.some(subject => 
              ['music', 'piano', 'guitar', 'violin', 'singing', 'voice', 'instrument', 'composition'].some(music => 
                subject.toLowerCase().includes(music)
              )
            )
          ).map((profile) => (
            <Box key={profile.id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <MusicIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h3">
                        {profile.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {profile.major} • {profile.year}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" paragraph>
                    {profile.bio}
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Music Services:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {profile.helpOffering.subjects.filter(subject => 
                        ['music', 'piano', 'guitar', 'violin', 'singing', 'voice', 'instrument', 'composition'].some(music => 
                          subject.toLowerCase().includes(music)
                        )
                      ).map((subject) => (
                        <Chip key={subject} label={subject} size="small" color="primary" />
                      ))}
                    </Box>
                  </Box>
                  <Typography variant="h6" color="primary">
                    ${profile.helpOffering.pricePerHour}/hour
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    startIcon={<ChatIcon />}
                    onClick={() => handleConnectClick(profile)}
                    fullWidth
                  >
                    Connect
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      </TabPanel>

      {/* Fitness Services Tab */}
      <TabPanel value={currentTab} index={7}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {getFilteredProfiles().filter(profile => 
            profile.helpOffering.isOffering && 
            profile.helpOffering.subjects.some(subject => 
              ['fitness', 'gym', 'workout', 'training', 'yoga', 'pilates', 'running', 'sports'].some(fitness => 
                subject.toLowerCase().includes(fitness)
              )
            )
          ).map((profile) => (
            <Box key={profile.id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <FitnessIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h3">
                        {profile.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {profile.major} • {profile.year}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" paragraph>
                    {profile.bio}
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Fitness Services:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {profile.helpOffering.subjects.filter(subject => 
                        ['fitness', 'gym', 'workout', 'training', 'yoga', 'pilates', 'running', 'sports'].some(fitness => 
                          subject.toLowerCase().includes(fitness)
                        )
                      ).map((subject) => (
                        <Chip key={subject} label={subject} size="small" color="primary" />
                      ))}
                    </Box>
                  </Box>
                  <Typography variant="h6" color="primary">
                    ${profile.helpOffering.pricePerHour}/hour
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    startIcon={<ChatIcon />}
                    onClick={() => handleConnectClick(profile)}
                    fullWidth
                  >
                    Connect
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      </TabPanel>

      {/* Food Services Tab */}
      <TabPanel value={currentTab} index={8}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {getFilteredProfiles().filter(profile => 
            profile.helpOffering.isOffering && 
            profile.helpOffering.subjects.some(subject => 
              ['cooking', 'baking', 'chef', 'food', 'culinary', 'recipe', 'meal', 'catering'].some(food => 
                subject.toLowerCase().includes(food)
              )
            )
          ).map((profile) => (
            <Box key={profile.id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <FoodServiceIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h3">
                        {profile.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {profile.major} • {profile.year}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" paragraph>
                    {profile.bio}
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Food Services:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {profile.helpOffering.subjects.filter(subject => 
                        ['cooking', 'baking', 'chef', 'food', 'culinary', 'recipe', 'meal', 'catering'].some(food => 
                          subject.toLowerCase().includes(food)
                        )
                      ).map((subject) => (
                        <Chip key={subject} label={subject} size="small" color="primary" />
                      ))}
                    </Box>
                  </Box>
                  <Typography variant="h6" color="primary">
                    ${profile.helpOffering.pricePerHour}/hour
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    startIcon={<ChatIcon />}
                    onClick={() => handleConnectClick(profile)}
                    fullWidth
                  >
                    Connect
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      </TabPanel>

      {/* Home Services Tab */}
      <TabPanel value={currentTab} index={9}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {getFilteredProfiles().filter(profile => 
            profile.helpOffering.isOffering && 
            profile.helpOffering.subjects.some(subject => 
              ['cleaning', 'repair', 'maintenance', 'plumbing', 'electrical', 'handyman', 'home', 'house'].some(home => 
                subject.toLowerCase().includes(home)
              )
            )
          ).map((profile) => (
            <Box key={profile.id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <HomeServiceIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h3">
                        {profile.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {profile.major} • {profile.year}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" paragraph>
                    {profile.bio}
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Home Services:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {profile.helpOffering.subjects.filter(subject => 
                        ['cleaning', 'repair', 'maintenance', 'plumbing', 'electrical', 'handyman', 'home', 'house'].some(home => 
                          subject.toLowerCase().includes(home)
                        )
                      ).map((subject) => (
                        <Chip key={subject} label={subject} size="small" color="primary" />
                      ))}
                    </Box>
                  </Box>
                  <Typography variant="h6" color="primary">
                    ${profile.helpOffering.pricePerHour}/hour
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    startIcon={<ChatIcon />}
                    onClick={() => handleConnectClick(profile)}
                    fullWidth
                  >
                    Connect
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      </TabPanel>

      {/* Counseling Services Tab */}
      <TabPanel value={currentTab} index={10}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {getFilteredProfiles().filter(profile => 
            profile.helpOffering.isOffering && 
            profile.helpOffering.subjects.some(subject => 
              ['counseling', 'therapy', 'mental health', 'psychology', 'support', 'wellness', 'life coaching'].some(counseling => 
                subject.toLowerCase().includes(counseling)
              )
            )
          ).map((profile) => (
            <Box key={profile.id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <CounselingIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h3">
                        {profile.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {profile.major} • {profile.year}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" paragraph>
                    {profile.bio}
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Counseling Services:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {profile.helpOffering.subjects.filter(subject => 
                        ['counseling', 'therapy', 'mental health', 'psychology', 'support', 'wellness', 'life coaching'].some(counseling => 
                          subject.toLowerCase().includes(counseling)
                        )
                      ).map((subject) => (
                        <Chip key={subject} label={subject} size="small" color="primary" />
                      ))}
                    </Box>
                  </Box>
                  <Typography variant="h6" color="primary">
                    ${profile.helpOffering.pricePerHour}/hour
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    startIcon={<ChatIcon />}
                    onClick={() => handleConnectClick(profile)}
                    fullWidth
                  >
                    Connect
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      </TabPanel>

      {/* Create Profile Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Your Student Profile</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Full Name"
              value={newProfile.name}
              onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
              fullWidth
              required
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Major</InputLabel>
                <Select
                  value={newProfile.major}
                  onChange={(e) => setNewProfile({ ...newProfile, major: e.target.value })}
                  label="Major"
                >
                  {majors.map(major => (
                    <MenuItem key={major} value={major}>{major}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box>
                <TextField
                  label="Year"
                  type="number"
                  value={newProfile.year}
                  onChange={(e) => setNewProfile({ ...newProfile, year: Number(e.target.value) })}
                  inputProps={{ min: 1, max: 6 }}
                  fullWidth
                />
              </Box>
            </Box>

            <TextField
              label="Bio"
              value={newProfile.bio}
              onChange={(e) => setNewProfile({ ...newProfile, bio: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="Tell us about yourself..."
            />

            {/* Contact Details Section */}
            <Box>
              <Typography variant="h6" gutterBottom>
                📞 Contact Details (Required)
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Email Address"
                  type="email"
                  value={newProfile.contactDetails.email}
                  onChange={(e) => setNewProfile({ 
                    ...newProfile, 
                    contactDetails: { ...newProfile.contactDetails, email: e.target.value }
                  })}
                  fullWidth
                  required
                  placeholder="your.email@university.edu"
                />
                <Box>
                  <TextField
                    label="Phone Number (Optional)"
                    type="tel"
                    value={newProfile.contactDetails.phone}
                    onChange={(e) => setNewProfile({ 
                      ...newProfile, 
                      contactDetails: { ...newProfile.contactDetails, phone: e.target.value }
                    })}
                    fullWidth
                    placeholder="(555) 123-4567"
                  />
                </Box>
              </Box>
              <Box>
                  <FormControl fullWidth>
                    <InputLabel>Preferred Contact Method</InputLabel>
                    <Select
                      value={newProfile.contactDetails.preferredContact}
                      onChange={(e) => setNewProfile({ 
                        ...newProfile, 
                        contactDetails: { ...newProfile.contactDetails, preferredContact: e.target.value as 'email' | 'phone' | 'both' }
                      })}
                      label="Preferred Contact Method"
                    >
                      <MenuItem value="email">Email Only</MenuItem>
                      <MenuItem value="phone">Phone Only</MenuItem>
                      <MenuItem value="both">Both Email & Phone</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
            </Box>

            {/* Hobbies */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>Hobbies</Typography>
              <Box display="flex" gap={1} mb={1}>
                <TextField
                  size="small"
                  placeholder="Add a hobby"
                  value={hobbyInput}
                  onChange={(e) => setHobbyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addHobby()}
                />
                <Button onClick={addHobby}>Add</Button>
              </Box>
              <Box>
                {newProfile.hobbies.map((hobby) => (
                  <Chip
                    key={hobby}
                    label={hobby}
                    onDelete={() => removeItem(newProfile.hobbies, hobby, 'hobbies')}
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            </Box>

            {/* Skills */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>Skills</Typography>
              <Box display="flex" gap={1} mb={1}>
                <TextField
                  size="small"
                  placeholder="Add a skill"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                />
                <Button onClick={addSkill}>Add</Button>
              </Box>
              <Box>
                {newProfile.skills.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    onDelete={() => removeItem(newProfile.skills, skill, 'skills')}
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            </Box>

            <Divider />

            {/* Knowledge Payment Section */}
            <Box>
              <Typography variant="h6" gutterBottom>
                💡 Knowledge Sharing (Optional)
              </Typography>
              <FormControl component="fieldset">
                <Box display="flex" alignItems="center" gap={2}>
                  <input
                    type="checkbox"
                    checked={newProfile.helpOffering.isOffering}
                    onChange={(e) => setNewProfile({
                      ...newProfile,
                      helpOffering: { ...newProfile.helpOffering, isOffering: e.target.checked }
                    })}
                  />
                  <Typography>I want to offer tutoring/help to other students</Typography>
                </Box>
              </FormControl>

              {newProfile.helpOffering.isOffering && (
                <Stack spacing={2} sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <TextField
                    label="Price per Hour ($)"
                    type="number"
                    value={newProfile.helpOffering.pricePerHour}
                    onChange={(e) => setNewProfile({
                      ...newProfile,
                      helpOffering: { ...newProfile.helpOffering, pricePerHour: Number(e.target.value) }
                    })}
                    inputProps={{ min: 0 }}
                  />

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Subjects I can help with</Typography>
                    <Box display="flex" gap={1} mb={1}>
                      <TextField
                        size="small"
                        placeholder="Add a subject"
                        value={subjectInput}
                        onChange={(e) => setSubjectInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                      />
                      <Button onClick={addSubject}>Add</Button>
                    </Box>
                    <Box>
                      {newProfile.helpOffering.subjects.map((subject) => (
                        <Chip
                          key={subject}
                          label={subject}
                          onDelete={() => removeItem(newProfile.helpOffering.subjects, subject, 'subjects')}
                          color="primary"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  </Box>

                  <TextField
                    label="Description of help you offer"
                    value={newProfile.helpOffering.description}
                    onChange={(e) => setNewProfile({
                      ...newProfile,
                      helpOffering: { ...newProfile.helpOffering, description: e.target.value }
                    })}
                    multiline
                    rows={2}
                    placeholder="Describe your teaching style, experience, etc."
                  />
                </Stack>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitProfile} 
            variant="contained"
            disabled={!newProfile.name.trim() || !newProfile.major.trim() || !newProfile.contactDetails.email.trim()}
          >
            Create Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onClose={() => setRatingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Rate {selectedProfileForRating?.name} Before Connecting
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
              Please rate this student before connecting. This helps maintain quality in our community.
            </Typography>
            
            <Box sx={{ my: 3 }}>
              <Typography component="legend" gutterBottom>
                Your Rating (Required)
              </Typography>
              <Rating
                value={userRating}
                onChange={(event, newValue) => {
                  setUserRating(newValue);
                }}
                size="large"
              />
            </Box>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Your Review (Optional)"
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Share your thoughts about this student..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitRating} 
            variant="contained"
            disabled={!userRating || userRating === 0}
          >
            Submit Rating & Connect
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contact Info Dialog */}
      <Dialog open={contactDialogOpen} onClose={() => setContactDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Contact Information - {selectedProfileForContact?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
              Here are the contact details for {selectedProfileForContact?.name}:
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="h6" gutterBottom>
                  📧 Email
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, wordBreak: 'break-all' }}>
                  {selectedProfileForContact?.contactDetails.email}
                </Typography>
                
                {selectedProfileForContact?.contactDetails.phone && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      📞 Phone
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedProfileForContact.contactDetails.phone}
                    </Typography>
                  </>
                )}
                
                <Typography variant="h6" gutterBottom>
                  Preferred Contact Method
                </Typography>
                <Typography variant="body1">
                  {selectedProfileForContact?.contactDetails.preferredContact === 'email' && 'Email Only'}
                  {selectedProfileForContact?.contactDetails.preferredContact === 'phone' && 'Phone Only'}
                  {selectedProfileForContact?.contactDetails.preferredContact === 'both' && 'Both Email & Phone'}
                </Typography>
              </Paper>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialogOpen(false)}>Close</Button>
          <Button 
            variant="contained"
            onClick={() => {
              // Copy email to clipboard
              if (selectedProfileForContact?.contactDetails.email) {
                navigator.clipboard.writeText(selectedProfileForContact.contactDetails.email);
                alert('Email copied to clipboard!');
              }
            }}
          >
            Copy Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Rate & Comment on {selectedProfileForComment?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
              Share your experience with {selectedProfileForComment?.name}:
            </Typography>
            
            <Box sx={{ my: 3 }}>
              <Typography component="legend" gutterBottom>
                Your Rating (Required)
              </Typography>
              <Rating
                value={newCommentRating}
                onChange={(event, newValue) => {
                  setNewCommentRating(newValue);
                }}
                size="large"
              />
            </Box>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Your Comment (Required)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about this student..."
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitComment} 
            variant="contained"
            disabled={!newCommentRating || newCommentRating === 0 || !newComment.trim()}
          >
            Submit Comment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConnectionSection;