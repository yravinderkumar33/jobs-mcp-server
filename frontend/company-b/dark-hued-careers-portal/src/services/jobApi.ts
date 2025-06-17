import api from '@/lib/api';
import { Job, SearchFilters, SearchResponse, JobDetailResponse, ApplicationData, ApplicationResponse, Application } from '@/services/types';

// --- Mapping function: backend job (yadav_consulting) -> frontend Job type ---
function mapBackendJobToFrontendJob(backendJob: any): Job {
  return {
    _id: backendJob._id,
    jobId: backendJob.jobId,
    title: backendJob.position?.name || '',
    description: backendJob.position?.summary || '',
    category: backendJob.position?.department || '',
    jobType: backendJob.position?.type || '',
    company: {
      name: backendJob.organization?.companyName || '',
      description: backendJob.organization?.about || '',
      industry: backendJob.organization?.sector || '',
    },
    location: {
      address: backendJob.workplace?.street || '',
      city: backendJob.workplace?.city || '',
      state: backendJob.workplace?.region || '',
      country: backendJob.workplace?.nation || '',
      postalCode: backendJob.workplace?.zipCode || '',
      latitude: backendJob.workplace?.geo?.lat,
      longitude: backendJob.workplace?.geo?.lng,
    },
    requirements: {
      experienceInYears: backendJob.qualifications?.minExperienceYears || 0,
      gender: backendJob.qualifications?.preferredGender || '',
      education: backendJob.qualifications?.degrees || [],
      certifications: backendJob.qualifications?.requiredCertificates || [],
      skills: backendJob.qualifications?.keySkills || [],
      languages: backendJob.qualifications?.spokenLanguages || [],
      assetsRequired: backendJob.qualifications?.mustHaveAssets || [],
    },
    responsibilities: backendJob.tasks || [],
    salary: {
      amount: backendJob.compensation?.value || 0,
      currency: backendJob.compensation?.currencyCode || '',
      frequency: backendJob.compensation?.payPeriod || '',
    },
    schedule: {
      shiftType: backendJob.workSchedule?.shift || '',
      hoursPerWeek: backendJob.workSchedule?.weeklyHours || 0,
      daysOfWeek: backendJob.workSchedule?.workingDays || [],
      startTime: backendJob.workSchedule?.start || '',
      endTime: backendJob.workSchedule?.end || '',
      overtimeAvailable: backendJob.workSchedule?.overtime || false,
      weekendWork: backendJob.workSchedule?.includesWeekend || false,
    },
    benefits: backendJob.perks || [],
    postedDate: backendJob.dates?.posted || '',
    validUntil: backendJob.dates?.expiry || '',
    metadata: {
      tags: backendJob.extra?.keywords || [],
    },
  };
}

// Convert filters object to query string
function toQueryString(params: Record<string, any>): string {
  return Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

export const getAllJobs = async (): Promise<SearchResponse> => {
  const response = await api.get('/jobs/query');
  let jobs = response.data?.result?.jobs || response.data?.jobs || response.data || [];
  if (Array.isArray(jobs)) {
    jobs = jobs.map(mapBackendJobToFrontendJob);
  }
  return { result: { jobs } } as SearchResponse;
};

export const searchJobs = async (filters: SearchFilters): Promise<SearchResponse> => {
  // Map frontend filters to backend query parameters
  const backendParams: Record<string, any> = {};
  
  if (filters.location) backendParams.location = filters.location;
  if (filters.jobType) backendParams.jobType = filters.jobType;
  if (filters.experienceLevel) backendParams.experience = filters.experienceLevel.toString();
  if (filters.limit) backendParams.limit = filters.limit;
  if (filters.sort) backendParams.sort = filters.sort;
  
  const query = toQueryString(backendParams);
  const url = query ? `/jobs/query?${query}` : '/jobs/query';
  
  const response = await api.get(url);
  let jobs = response.data?.result?.jobs || response.data?.jobs || response.data || [];
  
  // Apply client-side filtering for parameters not supported by backend
  if (Array.isArray(jobs)) {
    jobs = jobs.map(mapBackendJobToFrontendJob);
    
    // Client-side filtering for unsupported backend filters
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      jobs = jobs.filter((job: Job) => 
        job.title.toLowerCase().includes(searchLower) ||
        job.company.name.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        job.requirements.skills.some(skill => skill.toLowerCase().includes(searchLower))
      );
    }
    
    if (filters.salaryMin) {
      jobs = jobs.filter((job: Job) => job.salary.amount >= filters.salaryMin!);
    }
    
    if (filters.salaryMax) {
      jobs = jobs.filter((job: Job) => job.salary.amount <= filters.salaryMax!);
    }
    
    if (filters.category) {
      jobs = jobs.filter((job: Job) => 
        job.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }
    
    if (filters.skills && filters.skills.length > 0) {
      jobs = jobs.filter((job: Job) => 
        filters.skills!.some(skill => 
          job.requirements.skills.some(jobSkill => 
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }
  }
  
  return { result: { jobs } } as SearchResponse;
};

export const getJobDetail = async (jobId: string): Promise<JobDetailResponse> => {
  const response = await api.get(`/jobs/details/${jobId}`);
  let job = response.data?.result?.job || response.data?.job || response.data || {};
  job = mapBackendJobToFrontendJob(job);
  return { result: { job } } as JobDetailResponse;
};

export const applyToJob = async (jobId: string, applicationData: ApplicationData): Promise<ApplicationResponse> => {
  // Map frontend form data to backend expected parameters (matching actual controller)
  const params: Record<string, any> = {
    job_id: jobId,
    name: applicationData.applicant.full_name,
    age: applicationData.applicant.date_of_birth ? 
      new Date().getFullYear() - new Date(applicationData.applicant.date_of_birth).getFullYear() : '',
    gender: applicationData.applicant.gender,
    phone: applicationData.applicant.phone_number,
    address: `${applicationData.applicant.address.street}, ${applicationData.applicant.address.city}, ${applicationData.applicant.address.state} ${applicationData.applicant.address.postal_code}`.trim(),
    email: applicationData.applicant.email,
  };
  
  const query = toQueryString(params);
  const response = await api.get(`/applications/submit?${query}`);
  return response.data;
};

export const fetchApplications = async (): Promise<Application[]> => {
  try {
    const response = await api.get('/applications/list');
    return response.data?.result?.applications || response.data?.applications || [];
  } catch (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
};

export type { Job, ApplicationData, Application } from '@/services/types';
