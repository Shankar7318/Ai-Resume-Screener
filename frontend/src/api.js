import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: false,
  timeout: 30000000,
});

// Add token to requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Request to:', config.url);
    console.log('Token present:', !!token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Auth header set');
    } else {
      console.warn('No token found in localStorage');
      // Redirect to login if no token and not a login/register request
      if (!config.url.includes('/login') && !config.url.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
API.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 403 || error.response?.status === 401) {
      console.log('Authentication failed, redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth endpoints
export const login = (username, password) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  return API.post('/login', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const register = (username, email, password) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('email', email);
  formData.append('password', password);
  
  return API.post('/register', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Resume endpoints
export const uploadResume = (file, jobDescription) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('job_description', jobDescription);
  
  return API.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const bulkUploadResumes = (files, jobDescription) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  formData.append('job_description', jobDescription);
  
  return API.post('/bulk-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000, // Longer timeout for bulk upload
  });
};

// Candidate endpoints
export const getCandidates = () => {
  return API.get('/candidates');
};

export const getCandidate = (id) => {
  return API.get(`/candidates/${id}`);
};

// Export function
export const exportCandidates = (candidates) => {
  const headers = [
    'Name', 'Email', 'Phone', 'Skills', 'Experience Years',
    'Skills Score', 'Experience Score', 'Education Score', 'Overall Score',
    'Recommendation', 'Reason', 'Uploaded At'
  ];
  
  const csvData = candidates.map(c => [
    c.name || '',
    c.email || '',
    c.phone || '',
    (c.skills || []).join('; '),
    c.experience_years || 0,
    c.skills_score || 0,
    c.experience_score || 0,
    c.education_score || 0,
    c.overall_score || 0,
    c.recommendation || '',
    c.reason || '',
    c.uploaded_at || ''
  ]);
  
  const csv = [headers, ...csvData].map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  return new Blob([csv], { type: 'text/csv' });
};

// Search endpoints
export const semanticSearch = (query, searchType = 'hybrid') => {
  return API.post('/semantic-search', {
    query,
    search_type: searchType
  });
};

// Tag endpoints
export const addTags = (candidateIds, tag) => {
  return API.post('/add-tags', {
    candidate_ids: candidateIds,
    tag: tag
  });
};

// Interview endpoints
export const scheduleInterview = (candidateIds, date, time, type) => {
  return API.post('/schedule-interview', {
    candidate_ids: candidateIds,
    date,
    time,
    type
  });
};

// Email endpoints
export const sendEmails = (candidateIds, subject, body) => {
  return API.post('/send-emails', {
    candidate_ids: candidateIds,
    subject,
    body
  });
};

export default API;