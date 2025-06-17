import api from '@/lib/api';
import { Job, SearchFilters, SearchResponse, JobDetailResponse, ApplicationData, ApplicationResponse, Application } from '@/services/types';

// Utility to map backend job object to frontend Job type
function mapJobToFrontend(job: any): Job {
  // Helper to parse experience string to number
  const parseExperience = (exp: any) => {
    if (typeof exp === 'number') return exp;
    if (typeof exp === 'string') {
      const match = exp.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    }
    return 0;
  };

  // Helper to parse location string
  const parseLocation = (loc: any) => {
    if (typeof loc === 'object' && loc !== null) return loc;
    if (typeof loc === 'string') {
      // Try to split by comma for city/state
      const [city = '', state = ''] = loc.split(',').map((s: string) => s.trim());
      return {
        address: loc,
        city,
        state,
        country: 'India',
        postalCode: '',
        latitude: 0,
        longitude: 0
      };
    }
    return {
      address: '', city: '', state: '', country: 'India', postalCode: '', latitude: 0, longitude: 0
    };
  };

  // Helper to parse company string
  const parseCompany = (comp: any) => {
    if (typeof comp === 'object' && comp !== null) return comp;
    return {
      name: comp || '',
      description: '',
      industry: ''
    };
  };

  // Helper to parse requirements
  const parseRequirements = (req: any, exp: any) => {
    if (typeof req === 'object' && !Array.isArray(req) && req !== null) return req;
    return {
      experienceInYears: parseExperience(exp),
      education: [],
      certifications: [],
      skills: Array.isArray(req) ? req : [],
      languages: [],
      assetsRequired: []
    };
  };

  // Helper to parse salary
  const parseSalary = (sal: any) => {
    if (typeof sal === 'object' && sal !== null) {
      return {
        amount: sal.amount || 0,
        currency: sal.currency || 'INR',
        frequency: sal.frequency || 'monthly'
      };
    }
    return { amount: 0, currency: 'INR', frequency: 'monthly' };
  };

  // Helper to parse schedule
  const parseSchedule = (sch: any) => {
    if (typeof sch === 'object' && sch !== null) return sch;
    return {
      shiftType: '',
      hoursPerWeek: 0,
      daysOfWeek: [],
      startTime: '',
      endTime: '',
      overtimeAvailable: false,
      weekendWork: false
    };
  };

  return {
    _id: job._id || '',
    jobId: job.jobId || job._id || '',
    title: job.title || '',
    description: job.description || '',
    category: job.category || '',
    jobType: job.jobType || 'full_time',
    company: parseCompany(job.company),
    location: parseLocation(job.location),
    requirements: parseRequirements(job.requirements, job.experience),
    responsibilities: job.responsibilities || [],
    salary: parseSalary(job.salary),
    schedule: parseSchedule(job.schedule),
    benefits: job.benefits || [],
    postedDate: job.createdAt || job.postedDate || '',
    validUntil: job.validUntil || '',
    metadata: job.metadata || { tags: [] }
  };
}

export const getAllJobs = async (): Promise<SearchResponse> => {
  const response = await api.post('/jobs/search', { request: {} });
  // Map jobs to frontend type
  const jobs = (response.data?.result?.jobs || []).map(mapJobToFrontend);
  return { ...response.data, result: { ...response.data.result, jobs } };
};

export const searchJobs = async (filters: SearchFilters): Promise<SearchResponse> => {
  const response = await api.post('/jobs/search', {
    request: {
      filters,
      options: {
        sort: { postedDate: -1 },
        limit: 100
      }
    }
  });
  // Map jobs to frontend type
  const jobs = (response.data?.result?.jobs || []).map(mapJobToFrontend);
  return { ...response.data, result: { ...response.data.result, jobs } };
};

export const getJobDetail = async (jobId: string): Promise<JobDetailResponse> => {
  const response = await api.get(`/jobs/${jobId}`);
  // Map job to frontend type
  const job = mapJobToFrontend(response.data?.result?.job || {});
  return { ...response.data, result: { ...response.data.result, job } };
};

// Accepts either jobId or _id, but uses _id if present
export const applyToJob = async (jobIdentifier: string | { jobId?: string; _id?: string }, applicationData: ApplicationData): Promise<ApplicationResponse> => {
  let id = '';
  if (typeof jobIdentifier === 'object') {
    id = jobIdentifier._id || jobIdentifier.jobId || '';
  } else {
    id = jobIdentifier;
  }
  const response = await api.post(`/jobs/${id}/apply`, applicationData);
  return response.data;
};

// Additional function for the Applications page
export const fetchApplications = async (): Promise<Application[]> => {
  try {
    const response = await api.get('/jobs/applications');
    return response.data?.result?.applications || [];
  } catch (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
};

// Export types for compatibility
export type { Job, ApplicationData, Application } from '@/services/types'; 