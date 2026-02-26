import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCandidate } from '../api';
import { 
  ArrowLeftIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  CalendarIcon,
  TagIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  const fetchCandidate = async () => {
    try {
      const response = await getCandidate(id);
      setCandidate(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-500">Loading candidate details...</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Candidate not found</h3>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                Send Email
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Schedule Interview
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Candidate Header */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
                <div className="mt-1 flex items-center space-x-4">
                  <span className="flex items-center text-sm text-gray-500">
                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                    {candidate.email}
                  </span>
                  {candidate.phone && (
                    <span className="flex items-center text-sm text-gray-500">
                      <PhoneIcon className="h-4 w-4 mr-1" />
                      {candidate.phone}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${getScoreColor(candidate.overall_score)}`}>
                  {candidate.overall_score}%
                </div>
                <div className="text-sm text-gray-500">Overall Match</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'skills', 'experience', 'education', 'resume'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm capitalize
                  ${activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Score Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${getScoreBgColor(candidate.skills_score)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CpuChipIcon className="h-5 w-5 mr-2 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Skills Match</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(candidate.skills_score)}`}>
                      {candidate.skills_score}%
                    </span>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${getScoreBgColor(candidate.experience_score)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BriefcaseIcon className="h-5 w-5 mr-2 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Experience Match</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(candidate.experience_score)}`}>
                      {candidate.experience_score}%
                    </span>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${getScoreBgColor(candidate.education_score)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AcademicCapIcon className="h-5 w-5 mr-2 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Education Match</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(candidate.education_score)}`}>
                      {candidate.education_score}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Analysis */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">AI Analysis</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{candidate.reason}</p>
                </div>
              </div>

              {/* Key Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Experience</h3>
                  <p className="text-lg font-semibold">{candidate.experience_years} years</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Recommendation</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    candidate.recommendation === 'SELECT' ? 'bg-green-100 text-green-800' :
                    candidate.recommendation === 'REJECT' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {candidate.recommendation}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Extracted Skills</h3>
              <div className="flex flex-wrap gap-2">
                {candidate.skills?.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Resume Tab */}
          {activeTab === 'resume' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resume Content</h3>
              <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {candidate.resume_text || 'No resume text available'}
                </pre>
              </div>
            </div>
          )}

          {/* Tags Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <TagIcon className="h-4 w-4 mr-1" />
                Tags
              </h3>
              <button className="text-sm text-blue-600 hover:text-blue-800">
                + Add Tag
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {candidate.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800"
                >
                  {tag}
                  <button className="ml-1 text-purple-600 hover:text-purple-800">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}