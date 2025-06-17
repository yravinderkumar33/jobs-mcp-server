import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { JobsAPI } from '../api/jobs-api';
import { JobSearchRequestSchema, JobApplicationSchema } from '../types/job';

export function registerTools(server: McpServer, jobsAPI: JobsAPI) {

  server.tool(
    "search-jobs",
    "Search for all the jobs available in the database",
    {},
    async ({ }) => {
      try {
        const searchRequest = { filters: {}, options: {} };
        const response = await jobsAPI.searchJobs(searchRequest);

        const jobs = response?.result?.jobs || [];

        if (jobs.length === 0) {
          return {
            content: [{
              type: "text",
              text: `No jobs found. Check if there are jobs in the database.`
            }]
          };
        }

        const jobData = jobsAPI.transformMinimalJobData(jobs) || [];

        const resultText = `
        # Job Search Results

        We have found ${jobData.length} job opportunities for you:

        ${JSON.stringify(jobData)}
        ---
        **Next Steps:**
        - Use \`get-job-details\` tool with a specific Job ID to access comprehensive job information.
        - Use \`apply-to-yadav_consulting-job\` tool to apply to Yadav Consulting job if the job source_id is yadav_consulting
        - Use \`apply-to-rozgaar_setu-job\` tool to apply to Rozgaar Setu job if the job source_id is rozgaar_setu
        - Use \`fetch-job-categories\` tool to fetch all the job categories available in the database
        `;

        return {
          content: [{
            type: "text",
            text: resultText
          }]
        };

      } catch (error) {
        console.error('Search jobs error:', error);
        return {
          content: [{
            type: "text",
            text: `❌ Error searching for jobs: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );



  server.tool(
    "get-job-details",
    "Get detailed information about a specific job",
    {
      jobId: z.string().describe("The job ID to get detailed information for")
    },
    async ({ jobId }) => {
      try {
        const response = await jobsAPI.getJob(jobId);

        const job = response.result.job;

        const resultText = `
        # Job Details
        ${JSON.stringify(job, null, 2)}

        **Next Steps:**
        - Use \`search-jobs\` tool to find all jobs opportunities
        - Use \`apply-to-yadav_consulting-job\` tool to apply to Yadav Consulting job if the job source_id is yadav_consulting
        - Use \`apply-to-rozgaar_setu-job\` tool to apply to Rozgaar Setu job if the job source_id is rozgaar_setu
        - Use \`fetch-job-categories\` tool to fetch all the job categories available in the database
        `;

        return {
          content: [{
            type: "text",
            text: resultText
          }]
        };
      } catch (error) {
        console.error('Get job details error:', error);
        return {
          content: [{
            type: "text",
            text: `❌ Error getting job details for ${jobId}: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );


  server.tool(
    "apply-to-yadav_consulting-job",
    "Apply to Jobs where the job source_id is yadav_consulting",
    {
      jobId: z.string().describe("The job ID to apply for"),
      applicant: z.object({
        name: z.string().describe("Full name of the applicant"),
        age: z.string().describe("Age of the applicant"),
        gender: z.string().describe("Gender of the applicant"),
        phone: z.string().describe("Phone number of the applicant"),
        address: z.string().describe("Complete Address of the applicant")
      }).describe("Applicant details")
    },
    async ({ jobId, applicant }) => {

      const response = await jobsAPI.applyForJob(jobId, applicant);

      const successMessage = `
      # Application Submitted Successfully! ✅

      # Application Information 
      ${JSON.stringify(response)}

      # Applicant Information:**
      ${JSON.stringify(applicant)}
      `;

      return {
        content: [{
          type: "text",
          text: successMessage
        }]
      }
    }
  );

  server.tool(
    "apply-to-rozgaar_setu-job",
    "Apply to Jobs where the job source_id is rozgaar_setu",
    {
      jobId: z.string().describe("The job ID to apply for"),
      applicant: z.object({
        name: z.string().describe("Full name of the applicant"),
        age: z.string().describe("Age of the applicant"),
        email: z.string().describe("Email of the applicant"),
      }).describe("Applicant details")
    },
    async ({ jobId, applicant }) => {

      const response = await jobsAPI.applyForJob(jobId, applicant);

      const successMessage = `
      # Application Submitted Successfully! ✅

      # Application Information 
      ${JSON.stringify(response)}

      # Applicant Information:**
      ${JSON.stringify(applicant)}
      `;

      return {
        content: [{
          type: "text",
          text: successMessage
        }]
      }
    }
  );


  server.tool(
    "fetch-job-categories",
    "Fetch all the job categories available in the database",
    {},
    async ({ }) => {
      const searchRequest = { filters: {}, options: {} };
      const response = await jobsAPI.searchJobs(searchRequest);
      const jobs = response?.result?.jobs || [];
      const jobCategories = jobs.map((job: any) => job.category);
      const uniqueJobCategories = [...new Set(jobCategories)];

      return {
        content: [{
          type: "text",
          text: `The job categories are ${JSON.stringify(uniqueJobCategories)}`
        }]
      }
    }
  );

  server.tool(
    "fetch-all-source-ids",
    "Fetch all the job source IDs available in the database",
    {},
    async ({ }) => {
      const searchRequest = { filters: {}, options: {} };
      const response = await jobsAPI.searchJobs(searchRequest);
      const jobs = response?.result?.jobs || [];
      const jobSourceIds = jobs.map((job: any) => job.source_id);
      const uniqueJobSourceIds = [...new Set(jobSourceIds)];

      return {
        content: [{
          type: "text",
          text: `The job source IDs are ${JSON.stringify(uniqueJobSourceIds)}`
        }]
      }
    }
  );


  server.tool(
    "fetch-filtered-jobs",
    "Fetch jobs based on the given filters",
    {
      filters: z.object({
        gender: z.string().describe("The gender requirement for the job (e.g., male, female, any)").optional(),
        language: z.string().describe("The language required for the job (e.g., Hindi, Kannada, English)").optional(),
        location: z.string().describe("The location of the job (city, state, or address)").optional(),
      }).describe("The filters to apply to the job search")
    },
    async ({ filters }) => {
      try {

        const filterObj: any = {};

        if (filters.gender) {
          filterObj['job.requirements.gender'] = { $regex: filters.gender, $options: 'i' };
        }

        if (filters.language) {
          filterObj['job.requirements.languages'] = { $regex: filters.language, $options: 'i' };
        }

        if (filters.location) {
          filterObj.$or = filterObj.$or || [];
          filterObj.$or.push(
            { 'location.city': { $regex: filters.location, $options: 'i' } },
            { 'location.state': { $regex: filters.location, $options: 'i' } },
            { 'location.complete_address': { $regex: filters.location, $options: 'i' } }
          );
        }

        const searchRequest = { filters: filterObj, options: {} };
        const response = await jobsAPI.searchJobs(searchRequest);

        const jobs = response?.result?.jobs || [];

        if (jobs.length === 0) {
          return {
            content: [{
              type: "text",
              text: `No jobs found. Check if there are jobs in the database.`
            }]
          };
        }

        const jobData = jobsAPI.transformMinimalJobData(jobs) || [];

        const resultText = `
        # Job Search Results

        We have found ${jobData.length} job opportunities for you:

        ${JSON.stringify(jobData)}
        ---
        **Next Steps:**
        - Use \`get-job-details\` tool with a specific Job ID to access comprehensive job information.
        - Use \`apply-to-yadav_consulting-job\` tool to apply to Yadav Consulting job if the job source_id is yadav_consulting
        - Use \`apply-to-rozgaar_setu-job\` tool to apply to Rozgaar Setu job if the job source_id is rozgaar_setu
        - Use \`fetch-job-categories\` tool to fetch all the job categories available in the database
        `;

        return {
          content: [{
            type: "text",
            text: resultText
          }]
        };

      } catch (error) {
        console.error('Search jobs error:', error);
        return {
          content: [{
            type: "text",
            text: `❌ Error searching for jobs: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );


  server.tool(
    "get-application-status",
    "Get the status of a specific application",
    {
      jobId: z.string().describe("The job ID to get the status for"),
      applicationId: z.string().describe("The application ID to get the status for")
    },
    async ({ applicationId, jobId }) => {

      const response = await jobsAPI.getApplicationStatus(applicationId, jobId);

      return {
        content: [
          {
            type: "text",
            text: `The status of application ${applicationId} is ${response.result.application.status}`
          }
        ]
      };
    }
  )

} 