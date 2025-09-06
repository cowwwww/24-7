import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { Professor } from '../types/Professor';
import { addProfessor } from '../services/professorService';

interface AddProfessorProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const professorTitles = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Lecturer',
  'Senior Lecturer',
  'Instructor',
  'Teaching Assistant',
  'Tutor'
];

const AddProfessor: React.FC<AddProfessorProps> = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<Omit<Professor, 'id' | 'createdAt' | 'addedBy'>>({
    name: '',
    university: '',
    department: '',
    title: '',
    email: '',
    subjects: [],
    isVerified: false
  });
  
  const [currentSubject, setCurrentSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSelectChange = (field: keyof typeof formData) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const addSubject = () => {
    if (currentSubject.trim() && !formData.subjects.includes(currentSubject.trim())) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, currentSubject.trim()]
      }));
      setCurrentSubject('');
    }
  };

  const removeSubject = (subjectToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(subject => subject !== subjectToRemove)
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    // Validation
    if (!formData.name || !formData.university || !formData.department) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      await addProfessor(formData);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      university: '',
      department: '',
      title: '',
      email: '',
      subjects: [],
      isVerified: false
    });
    setCurrentSubject('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          Add New 
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Help others by adding educators/courses to our database. Anyone can contribute!
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">Professor added successfully!</Alert>}
          
          <TextField
            label="Full Name/Course Name *"
            variant="outlined"
            value={formData.name}
            onChange={handleInputChange('name')}
            fullWidth
          />
          
          <TextField
            label="University/Institution *"
            variant="outlined"
            value={formData.university}
            onChange={handleInputChange('university')}
            fullWidth
          />
          
          <TextField
            label="Department *"
            variant="outlined"
            value={formData.department}
            onChange={handleInputChange('department')}
            fullWidth
          />
          

          
          <TextField
            label="Country (Optional)"
            variant="outlined"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            fullWidth
          />
          

        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || success}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Adding...' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddProfessor; 