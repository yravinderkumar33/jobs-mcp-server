/**
 * API Controller
 * Auto-generated controller template with all operations
 * Generated from OpenAPI specification
 */

// Import models and database service
const Job = require('../models/Job');
const Application = require('../models/Application');
const DatabaseService = require('../services/databaseService');
const { v4: uuidv4 } = require('uuid');

// Initialize database services
const jobService = new DatabaseService(Job);
const applicationService = new DatabaseService(Application);

/**
 * Search jobs with filters
 * Search for jobs using various filters and options
 * Route: POST /api/jobs/search
 * Tags: Jobs
 */
async function searchJobs(req, res) {
  try {
    console.log(req.body);
    
    const { filters = {}, options = {} } = req.body.request || {};
    
    // Use the database service to search for jobs
    const jobs = await jobService.search(filters, options);
    
    const response = {
      id: req.operation.operationId,
      ver: "2.0",
      ets: Date.now(),
      params: {
        msgid: require('crypto').randomUUID(),
        err: "",
        status: "SUCCESSFUL",
        errmsg: ""
      },
      responseCode: "OK",
      result: {
        jobs
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in searchJobs:', error);
    res.status(500).json({
      id: req.operation.operationId,
      ver: "1.0",
      ets: Date.now(),
      params: {
        msgid: require('crypto').randomUUID(),
        err: "INTERNAL_ERROR",
        status: "FAILED",
        errmsg: error.message
      },
      responseCode: "INTERNAL_ERROR",
      result: { jobs: [] }
    });
  }
}

/**
 * Get job details
 * Retrieve detailed information about a specific job
 * Route: GET /api/jobs/{job_id}
 * Tags: Jobs
 */
async function getJobDetails(req, res) {
  try {
    const { job_id } = req.params;
    
    // Use the database service to find the job
    const job = await jobService.findOne({ jobId: job_id });
    
    if (!job) {
      return res.status(404).json({
        id: req.operation.operationId,
        ver: "1.0",
        ets: Date.now(),
        params: {
          msgid: require('crypto').randomUUID(),
          err: "NOT_FOUND",
          status: "FAILED",
          errmsg: "Job not found"
        },
        responseCode: "NOT_FOUND",
        result: { job: {} }
      });
    }
    
    const response = {
      id: req.operation.operationId,
      ver: "1.0",
      ets: Date.now(),
      params: {
        msgid: require('crypto').randomUUID(),
        err: "",
        status: "SUCCESSFUL",
        errmsg: ""
      },
      responseCode: "OK",
      result: {
        job
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getJobDetails:', error);
    res.status(500).json({
      id: req.operation.operationId,
      ver: "1.0",
      ets: Date.now(),
      params: {
        msgid: require('crypto').randomUUID(),
        err: "INTERNAL_ERROR",
        status: "FAILED",
        errmsg: error.message
      },
      responseCode: "INTERNAL_ERROR",
      result: { job: {} }
    });
  }
}

/**
 * Apply to a job
 * Submit an application for a specific job
 * Route: POST /api/jobs/{job_id}/apply
 * Tags: Jobs, Applications
 */
async function applyToJob(req, res) {
  try {
    const { job_id } = req.params;
    
    // Check if job exists
    const jobExists = await jobService.exists({ jobId: job_id });
    
    if (!jobExists) {
      return res.status(404).json({
        id: req.operation.operationId,
        ver: "1.0",
        ets: Date.now(),
        params: {
          msgid: require('crypto').randomUUID(),
          err: "NOT_FOUND",
          status: "FAILED",
          errmsg: "Job not found"
        },
        responseCode: "NOT_FOUND",
        result: { application: {} }
      });
    }

    const application_id = `APP-${Math.floor(Math.random() * 1000000)}-${uuidv4().slice(0, 4).toUpperCase()}`;
    const submitted_on = new Date();
    
    const applicationData = {
      ...req.body,
      application_id,
      job_id,
      submitted_on
    };
    
    // Create the application using the database service
    const application = await applicationService.create(applicationData);
    
    const response = {
      id: req.operation.operationId,
      ver: "1.0",
      ets: Date.now(),
      params: {
        msgid: require('crypto').randomUUID(),
        err: "",
        status: "SUCCESSFUL",
        errmsg: ""
      },
      responseCode: "OK",
      result: {
        application: {
          application_id,
          job_id,
          status: 'submitted',
          applied_at: submitted_on.toISOString()
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in applyToJob:', error);
    res.status(500).json({
      id: req.operation.operationId,
      ver: "1.0",
      ets: Date.now(),
      params: {
        msgid: require('crypto').randomUUID(),
        err: "INTERNAL_ERROR",
        status: "FAILED",
        errmsg: error.message
      },
      responseCode: "INTERNAL_ERROR",
      result: { application: {} }
    });
  }
}

/**
 * Get all job applications
 * Retrieve a list of all job applications
 * Route: GET /api/jobs/applications
 * Tags: Applications
 */
async function getAllApplications(req, res) {
  try {
    // Use the database service to get all applications
    const applications = await applicationService.search();
    
    const response = {
      id: req.operation.operationId,
      ver: "1.0",
      ets: Date.now(),
      params: {
        msgid: require('crypto').randomUUID(),
        err: "",
        status: "SUCCESSFUL",
        errmsg: ""
      },
      responseCode: "OK",
      result: {
        applications
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getAllApplications:', error);
    res.status(500).json({
      id: req.operation.operationId,
      ver: "1.0",
      ets: Date.now(),
      params: {
        msgid: require('crypto').randomUUID(),
        err: "INTERNAL_ERROR",
        status: "FAILED",
        errmsg: error.message
      },
      responseCode: "INTERNAL_ERROR",
      result: { applications: [] }
    });
  }
}

module.exports = {
  searchJobs,
  getJobDetails,
  applyToJob,
  getAllApplications
};
