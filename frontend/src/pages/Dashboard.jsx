import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCandidates, uploadResume, bulkUploadResumes, exportCandidates } from '../api';
import { 
  DocumentArrowUpIcon, 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EnvelopeIcon,
  CalendarIcon,
  TagIcon,
  CloudArrowUpIcon,
  MagnifyingGlassCircleIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function Dashboard() {
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('overall_score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewType, setInterviewType] = useState('video');
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const navigate = useNavigate();

  // Responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    filterAndSortCandidates();
  }, [candidates, filter, searchTerm, sortBy, sortOrder]);

  const fetchCandidates = async () => {
    try {
      const response = await getCandidates();
      setCandidates(response.data);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCandidates = () => {
    let filtered = [...candidates];

    // Filter by recommendation
    if (filter === 'selected') {
      filtered = filtered.filter(c => c.recommendation === 'SELECT');
    } else if (filter === 'rejected') {
      filtered = filtered.filter(c => c.recommendation === 'REJECT');
    } else if (filter === 'processing') {
      filtered = filtered.filter(c => c.recommendation === 'PROCESSING');
    }

    // Search
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.skills?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy] || 0;
      let bVal = b[sortBy] || 0;
      if (sortOrder === 'desc') {
        return bVal - aVal;
      }
      return aVal - bVal;
    });

    setFilteredCandidates(filtered);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleBulkFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(10);
    setUploadStatus('Uploading file...');

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 2000);

      setUploadStatus('Analyzing resume with AI...');
      
      const response = await uploadResume(selectedFile, jobDescription);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('Analysis complete!');
      
      setTimeout(() => {
        setShowUpload(false);
        setSelectedFile(null);
        setJobDescription('');
        setUploadProgress(0);
        setUploadStatus('');
        fetchCandidates();
      }, 1500);
      
    } catch (error) {
      console.error('Error uploading:', error);
      setUploadStatus('Error: Upload failed. Please try again.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFiles.length) return;

    setBulkUploading(true);
    setUploadProgress(10);
    setUploadStatus(`Uploading ${selectedFiles.length} files...`);

    try {
      const response = await bulkUploadResumes(selectedFiles, jobDescription);
      
      setUploadProgress(100);
      setUploadStatus(`Successfully uploaded ${selectedFiles.length} resumes!`);
      
      setTimeout(() => {
        setShowBulkUpload(false);
        setSelectedFiles([]);
        setJobDescription('');
        setUploadProgress(0);
        setUploadStatus('');
        fetchCandidates();
      }, 1500);
      
    } catch (error) {
      console.error('Error bulk uploading:', error);
      setUploadStatus('Error: Upload failed. Please try again.');
    } finally {
      setBulkUploading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await exportCandidates(filteredCandidates);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'candidates.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const handleSendEmails = async () => {
    try {
      // API call to send emails
      const response = await fetch('http://localhost:8000/send-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          candidateIds: selectedCandidates,
          subject: emailSubject,
          body: emailBody
        })
      });
      
      if (response.ok) {
        alert('Emails sent successfully!');
        setShowEmailModal(false);
        setSelectedCandidates([]);
      }
    } catch (error) {
      console.error('Error sending emails:', error);
    }
  };

  const handleScheduleInterview = async () => {
    try {
      const response = await fetch('http://localhost:8000/schedule-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          candidateIds: selectedCandidates,
          date: interviewDate,
          time: interviewTime,
          type: interviewType
        })
      });
      
      if (response.ok) {
        alert('Interviews scheduled successfully!');
        setShowScheduleModal(false);
        setSelectedCandidates([]);
      }
    } catch (error) {
      console.error('Error scheduling interviews:', error);
    }
  };

  const handleAddTag = async () => {
    if (!newTag || !selectedCandidates.length) return;

    try {
      const response = await fetch('http://localhost:8000/add-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          candidateIds: selectedCandidates,
          tag: newTag
        })
      });
      
      if (response.ok) {
        alert('Tags added successfully!');
        setShowTagModal(false);
        setNewTag('');
        setSelectedCandidates([]);
        fetchCandidates();
      }
    } catch (error) {
      console.error('Error adding tags:', error);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  // Calculate statistics
  const stats = {
    total: candidates.length,
    selected: candidates.filter(c => c.recommendation === 'SELECT').length,
    rejected: candidates.filter(c => c.recommendation === 'REJECT').length,
    processing: candidates.filter(c => c.recommendation === 'PROCESSING').length,
    avgScore: candidates.reduce((acc, c) => acc + (c.overall_score || 0), 0) / candidates.length || 0,
    avgSkills: candidates.reduce((acc, c) => acc + (c.skills_score || 0), 0) / candidates.length || 0,
    avgExperience: candidates.reduce((acc, c) => acc + (c.experience_score || 0), 0) / candidates.length || 0,
    avgEducation: candidates.reduce((acc, c) => acc + (c.education_score || 0), 0) / candidates.length || 0
  };

  // Chart data
  const scoreDistributionData = {
    labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
    datasets: [
      {
        label: 'Number of Candidates',
        data: [
          candidates.filter(c => c.overall_score <= 20).length,
          candidates.filter(c => c.overall_score > 20 && c.overall_score <= 40).length,
          candidates.filter(c => c.overall_score > 40 && c.overall_score <= 60).length,
          candidates.filter(c => c.overall_score > 60 && c.overall_score <= 80).length,
          candidates.filter(c => c.overall_score > 80).length
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }
    ]
  };

  const recommendationData = {
    labels: ['Selected', 'Rejected', 'Processing'],
    datasets: [
      {
        data: [stats.selected, stats.rejected, stats.processing],
        backgroundColor: [
          'rgba(34, 197, 94, 0.5)',
          'rgba(239, 68, 68, 0.5)',
          'rgba(234, 179, 8, 0.5)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
          'rgb(234, 179, 8)'
        ],
        borderWidth: 1
      }
    ]
  };

  const scoreTrendData = {
    labels: candidates.slice(0, 10).map(c => c.name?.split(' ')[0] || 'Candidate'),
    datasets: [
      {
        label: 'Overall Score',
        data: candidates.slice(0, 10).map(c => c.overall_score || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4
      },
      {
        label: 'Skills Score',
        data: candidates.slice(0, 10).map(c => c.skills_score || 0),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        tension: 0.4
      }
    ]
  };

  // Mobile responsive classes
  const containerClass = isMobile ? 'p-2' : 'p-6';
  const gridClass = isMobile ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-4';
  const buttonClass = isMobile ? 'w-full' : '';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - Responsive */}
      <nav className="bg-white shadow-sm">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isMobile ? 'py-2' : ''}`}>
          <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-between'} h-16`}>
            <div className="flex items-center">
              <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900`}>
                AI Resume Screener
              </h1>
              {isMobile && (
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="ml-2 p-2 text-gray-600 hover:text-gray-900"
                >
                  <ChartBarIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            <div className={`flex ${isMobile ? 'flex-wrap gap-2' : 'items-center'} ${buttonClass}`}>
              <button
                onClick={() => setShowUpload(true)}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 ${buttonClass}`}
              >
                <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                {!isMobile && 'Upload Resume'}
                {isMobile && 'Upload'}
              </button>
              <button
                onClick={() => setShowBulkUpload(true)}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 ${buttonClass}`}
              >
                <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                {!isMobile && 'Bulk Upload'}
                {isMobile && 'Bulk'}
              </button>
              <button
                onClick={handleExport}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${buttonClass}`}
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                {!isMobile && 'Export'}
              </button>
              <button
                onClick={handleLogout}
                className={`px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 ${buttonClass}`}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Analytics Toggle */}
      {isMobile && showAnalytics && (
        <div className="bg-white shadow-sm mt-2 p-4">
          <h2 className="text-lg font-semibold mb-3">Analytics Dashboard</h2>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-xs text-gray-600">Total</div>
              <div className="text-xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-xs text-gray-600">Selected</div>
              <div className="text-xl font-bold text-green-600">{stats.selected}</div>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <div className="text-xs text-gray-600">Rejected</div>
              <div className="text-xl font-bold text-red-600">{stats.rejected}</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded">
              <div className="text-xs text-gray-600">Avg Score</div>
              <div className="text-xl font-bold text-yellow-600">{stats.avgScore.toFixed(1)}%</div>
            </div>
          </div>

          {/* Mini Charts */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Recommendation Breakdown</h3>
              <div className="h-32">
                <Pie data={recommendationData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto ${containerClass}`}>
        {/* Desktop Analytics Dashboard */}
        {!isMobile && (
          <div className="mb-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
                Analytics Dashboard
              </h2>
              
              {/* Stats Cards */}
              <div className={`grid ${gridClass} gap-4 mb-6`}>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total Candidates</div>
                  <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Selected</div>
                  <div className="text-3xl font-bold text-green-600">{stats.selected}</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Rejected</div>
                  <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Avg Score</div>
                  <div className="text-3xl font-bold text-yellow-600">{stats.avgScore.toFixed(1)}%</div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Score Distribution</h3>
                  <div className="h-64">
                    <Bar data={scoreDistributionData} options={{ maintainAspectRatio: false }} />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Recommendation Breakdown</h3>
                  <div className="h-64">
                    <Pie data={recommendationData} options={{ maintainAspectRatio: false }} />
                  </div>
                </div>
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Top 10 Candidates Score Trend</h3>
                  <div className="h-64">
                    <Line data={scoreTrendData} options={{ maintainAspectRatio: false }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-lg font-medium mb-4">Upload Resume</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Resume File (PDF, DOCX)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                  />
                  {selectedFile && (
                    <p className="mt-1 text-xs text-gray-500">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Job Description (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Enter job description or leave empty for default..."
                    disabled={uploading}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                  />
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">{uploadStatus}</span>
                      <span className="text-gray-900 font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      AI analysis may take 30-60 seconds...
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowUpload(false)}
                    disabled={uploading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : 'Upload'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showBulkUpload && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-lg font-medium mb-4">Bulk Upload Resumes</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Select Multiple Resumes (PDF, DOCX)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    multiple
                    onChange={handleBulkFileSelect}
                    disabled={bulkUploading}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Selected files:</p>
                      <ul className="mt-1 text-xs text-gray-600 max-h-32 overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                          <li key={index} className="truncate">
                            • {file.name} ({(file.size / 1024).toFixed(1)} KB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Job Description (Optional - will apply to all)
                  </label>
                  <textarea
                    rows={4}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Enter job description or leave empty for default..."
                    disabled={bulkUploading}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:opacity-50"
                  />
                </div>

                {/* Upload Progress */}
                {bulkUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">{uploadStatus}</span>
                      <span className="text-gray-900 font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowBulkUpload(false)}
                    disabled={bulkUploading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkUpload}
                    disabled={!selectedFiles.length || bulkUploading}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                  >
                    {bulkUploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : `Upload ${selectedFiles.length} Files`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center">
                <EnvelopeIcon className="h-5 w-5 mr-2 text-blue-600" />
                Send Email to {selectedCandidates.length} Candidates
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Interview Invitation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Dear Candidate,..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmails}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Send Emails
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interview Scheduling Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                Schedule Interview for {selectedCandidates.length} Candidates
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time</label>
                    <input
                      type="time"
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Interview Type</label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="video">Video Call</option>
                    <option value="phone">Phone Call</option>
                    <option value="inperson">In-Person</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleScheduleInterview}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tag Modal */}
        {showTagModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center">
                <TagIcon className="h-5 w-5 mr-2 text-blue-600" />
                Add Tags to {selectedCandidates.length} Candidates
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Tag</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="flex-1 block w-full border border-gray-300 rounded-l-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g., Senior Developer"
                    />
                    <button
                      onClick={handleAddTag}
                      className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Existing Tags</label>
                  <select
                    value={selectedTag}
                    onChange={(e) => {
                      setSelectedTag(e.target.value);
                      setNewTag(e.target.value);
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select existing tag</option>
                    {tags.map((tag, index) => (
                      <option key={index} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowTagModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className={`bg-white shadow rounded-lg mb-6 p-4 ${isMobile ? 'space-y-3' : ''}`}>
          <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-3`}>
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or skills..."
                className={`pl-9 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500 text-sm ${isMobile ? 'text-base' : ''}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className={`flex ${isMobile ? 'flex-wrap' : 'items-center'} gap-2`}>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Candidates</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="processing">Processing</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="overall_score">Sort by Overall Score</option>
                <option value="skills_score">Sort by Skills Score</option>
                <option value="experience_score">Sort by Experience Score</option>
                <option value="education_score">Sort by Education Score</option>
                <option value="experience_years">Sort by Years Exp</option>
                <option value="name">Sort by Name</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
              >
                {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
              </button>

              {selectedCandidates.length > 0 && (
                <>
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    title="Send Email"
                  >
                    <EnvelopeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                    title="Schedule Interview"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowTagModal(true)}
                    className="px-3 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                    title="Add Tags"
                  >
                    <TagIcon className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm || filter !== 'all') && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500">Active filters:</span>
                            {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                  Search: {searchTerm}
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filter !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                  Filter: {filter}
                  <button
                    onClick={() => setFilter('all')}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Candidates List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Candidate Rankings
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Showing {filteredCandidates.length} of {candidates.length} candidates
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (selectedCandidates.length === filteredCandidates.length) {
                    setSelectedCandidates([]);
                  } else {
                    setSelectedCandidates(filteredCandidates.map(c => c.id));
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedCandidates.length === filteredCandidates.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-500">Loading candidates...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-12">
              <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No candidates found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Upload resumes to start screening'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredCandidates.map((candidate) => (
                <li 
                  key={candidate.id} 
                  className={`px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors ${
                    selectedCandidates.includes(candidate.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Checkbox for bulk actions */}
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.includes(candidate.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCandidates([...selectedCandidates, candidate.id]);
                          } else {
                            setSelectedCandidates(selectedCandidates.filter(id => id !== candidate.id));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </div>

                    {/* Candidate Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <button
                            onClick={() => navigate(`/candidate/${candidate.id}`)}
                            className="text-left"
                          >
                            <p className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate">
                              {candidate.name || 'Unknown'}
                            </p>
                          </button>
                          {candidate.recommendation === 'SELECT' ? (
                            <CheckCircleIcon className="ml-2 h-5 w-5 text-green-500" />
                          ) : candidate.recommendation === 'REJECT' ? (
                            <XCircleIcon className="ml-2 h-5 w-5 text-red-500" />
                          ) : candidate.recommendation === 'PROCESSING' ? (
                            <ClockIcon className="ml-2 h-5 w-5 text-yellow-500" />
                          ) : null}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            candidate.recommendation === 'SELECT' ? 'bg-green-100 text-green-800' :
                            candidate.recommendation === 'REJECT' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {candidate.recommendation || 'PENDING'}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-500">{candidate.email || 'No email'}</p>
                      
                      {/* Skills Tags */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {candidate.skills?.slice(0, isMobile ? 3 : 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.skills?.length > (isMobile ? 3 : 5) && (
                          <span className="text-xs text-gray-500">
                            +{candidate.skills.length - (isMobile ? 3 : 5)} more
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      {candidate.tags && candidate.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {candidate.tags.map((tag, idx) => (
                            <span
                                                            key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                            >
                              <TagIcon className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Detailed Score Breakdown */}
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className={`p-2 rounded ${getScoreBgColor(candidate.skills_score)}`}>
                          <div className="text-xs text-gray-600">Skills</div>
                          <div className={`text-sm font-bold ${getScoreColor(candidate.skills_score)}`}>
                            {candidate.skills_score || 0}%
                          </div>
                        </div>
                        <div className={`p-2 rounded ${getScoreBgColor(candidate.experience_score)}`}>
                          <div className="text-xs text-gray-600">Experience</div>
                          <div className={`text-sm font-bold ${getScoreColor(candidate.experience_score)}`}>
                            {candidate.experience_score || 0}%
                          </div>
                        </div>
                        <div className={`p-2 rounded ${getScoreBgColor(candidate.education_score)}`}>
                          <div className="text-xs text-gray-600">Education</div>
                          <div className={`text-sm font-bold ${getScoreColor(candidate.education_score)}`}>
                            {candidate.education_score || 0}%
                          </div>
                        </div>
                        <div className={`p-2 rounded ${getScoreBgColor(candidate.overall_score)}`}>
                          <div className="text-xs text-gray-600">Overall</div>
                          <div className={`text-sm font-bold ${getScoreColor(candidate.overall_score)}`}>
                            {candidate.overall_score || 0}%
                          </div>
                        </div>
                      </div>

                      {/* Experience Years and Upload Time */}
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                        <span>{candidate.experience_years || 0} years experience</span>
                        <span>{formatTimeAgo(candidate.uploaded_at)}</span>
                      </div>

                      {/* Reason */}
                      {candidate.reason && candidate.recommendation !== 'PROCESSING' && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <span className="font-medium">Analysis:</span> {candidate.reason}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Semantic Search Bar (Sticky) */}
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={() => {
              // Toggle semantic search modal
              const modal = document.getElementById('semanticSearchModal');
              if (modal) modal.classList.toggle('hidden');
            }}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          >
            <MagnifyingGlassCircleIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Semantic Search Modal */}
        <div id="semanticSearchModal" className="hidden fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <MagnifyingGlassCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
              Semantic Search
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Search Query
                </label>
                <textarea
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Find candidates with Python and Machine Learning experience who have worked on NLP projects..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Search Type
                </label>
                <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option value="semantic">Semantic (AI-powered)</option>
                  <option value="keyword">Keyword</option>
                  <option value="hybrid">Hybrid (Recommended)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    document.getElementById('semanticSearchModal').classList.add('hidden');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}