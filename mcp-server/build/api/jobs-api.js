"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsAPI = void 0;
const axios_1 = __importDefault(require("axios"));
class JobsAPI {
    baseUrl;
    constructor(baseUrl = 'http://localhost:6000') {
        this.baseUrl = baseUrl;
        // Configure axios defaults
        axios_1.default.defaults.headers.common['Content-Type'] = 'application/json';
    }
    /**
     * Search for jobs with optional filters and pagination
     */
    async searchJobs(request) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/api/jobs/search`, request, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Failed to search jobs:', error);
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Failed to search jobs: ${error.response?.status} ${error.response?.statusText || error.message}`);
            }
            throw new Error(`Failed to search jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get detailed information about a specific job
     */
    async getJob(jobId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/jobs/${jobId}`, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            return response.data;
        }
        catch (error) {
            console.error(`Failed to get job ${jobId}:`, error);
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Failed to get job details: ${error.response?.status} ${error.response?.statusText || error.message}`);
            }
            throw new Error(`Failed to get job details: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Apply for a specific job
     */
    async applyForJob(jobId, application) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/api/jobs/${jobId}/apply`, application, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            return response.data;
        }
        catch (error) {
            console.error(`Failed to apply for job ${jobId}:`, error);
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Failed to apply for job: ${error.response?.status} ${error.response?.statusText || error.message}`);
            }
            throw new Error(`Failed to apply for job: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get formatted job listing for display
     */
    formatJobForDisplay(job) {
        const compensation = job.compensation.max_amount
            ? `${job.compensation.currency} ${job.compensation.min_amount.toLocaleString()} - ${job.compensation.max_amount.toLocaleString()}`
            : `${job.compensation.currency} ${job.compensation.min_amount.toLocaleString()}`;
        return `**${job.job.title}** at ${job.company.name}
📍 Location: ${job.location.complete_address}
💰 Salary: ${compensation}
📅 Employment Type: ${job.job.employment_type}
⏰ Posted: ${new Date(job.job.posted_at).toLocaleDateString()}
⏳ Expires: ${new Date(job.job.expires_at).toLocaleDateString()}

**Description:**
${job.job.description}

**Requirements:**
• Experience: ${job.job.requirements.experience}
• Education: ${job.job.requirements.education.join(', ')}
• Skills: ${job.job.requirements.skills.join(', ')}
• Languages: ${job.job.requirements.languages.join(', ')}
• Assets Required: ${job.job.requirements.assetsRequired.join(', ')}

**Responsibilities:**
${job.job.responsibilities.map(r => `• ${r}`).join('\n')}

**Benefits:**
${job.job.benefits.map(b => `• ${b.replace(/_/g, ' ')}`).join('\n')}

---
Job ID: ${job.jobId}
`;
    }
    async getApplicationStatus(applicationId, jobId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/jobs/applications/${jobId}/${applicationId}/status`, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            return response.data;
        }
        catch (error) {
            console.error(`Failed to get application status ${applicationId}:`, error);
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Failed to get application status: ${error.response?.status} ${error.response?.statusText || error.message}`);
            }
            throw new Error(`Failed to get application status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    transformMinimalJobData(rawJobs) {
        return rawJobs.map(entry => {
            // Safely access nested properties with null checks
            const job = entry?.job;
            const jobData = job?.job;
            const company = job?.company;
            const location = job?.location;
            const compensation = job?.compensation;
            const requirements = jobData?.requirements;
            return {
                jobId: job?.jobId || 'N/A',
                title: jobData?.title || 'Job Title Not Available',
                source_id: job?.source_id || 'N/A',
                description: jobData?.description || 'Job Description Not Available',
                company: company?.name || 'Company Not Specified',
                location: this.formatLocation(location),
                salary: this.formatSalary(compensation),
                experience: requirements?.experience || 'Not specified',
                postedAt: jobData?.posted_at || null,
            };
        });
    }
    formatLocation(location) {
        if (!location)
            return 'Location not specified';
        const city = location.city || '';
        const state = location.state || '';
        if (city && state) {
            return `${city}, ${state}`;
        }
        else if (city) {
            return city;
        }
        else if (state) {
            return state;
        }
        else {
            return 'Location not specified';
        }
    }
    formatSalary(compensation) {
        if (!compensation)
            return 'Not specified';
        const currency = compensation.currency || '₹';
        const minAmount = compensation.min_amount;
        const maxAmount = compensation.max_amount;
        if (!minAmount && !maxAmount) {
            return 'Not specified';
        }
        if (minAmount && maxAmount) {
            return `${currency}${minAmount.toLocaleString()} - ${currency}${maxAmount.toLocaleString()}`;
        }
        else if (minAmount) {
            return `${currency}${minAmount.toLocaleString()}`;
        }
        else if (maxAmount) {
            return `Up to ${currency}${maxAmount.toLocaleString()}`;
        }
        return 'Not specified';
    }
}
exports.JobsAPI = JobsAPI;
