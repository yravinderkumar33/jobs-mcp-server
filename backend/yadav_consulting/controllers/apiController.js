/**
 * API Controller
 * Auto-generated controller template with all operations
 * Generated from OpenAPI specification: Blue Collar Jobs API v1.0.0
 * Template API Version: 1.0
 * Generated on: 2025-06-16T09:03:25.782Z
 */

const Job = require('../models/Job');
const Application = require('../models/Application');
const DatabaseService = require('../services/databaseService');
const { v4: uuidv4 } = require('uuid');


/**
 * Query jobs with filters
 * Search for jobs using filters and options via query parameters
 * Route: GET /jobs/query
 * Tags: Jobs
 *
 * @param {string} location - No description (query)
 * @param {string} jobType - No description (query)
 * @param {string} experience - No description (query)
 * @param {integer} limit - No description (query)
 * @param {string} sort - No description (query)
 */
async function searchJobs(req, res) {
  try {
    const jobService = new DatabaseService(Job);
    const jobs = await jobService.search({}, {});
    res.json({
      id: req.operation.operationId,
      error: null,
      result: {
        count: jobs.length,
        jobs
      }
    });
  } catch (error) {
    res.status(500).json({
      id: req.operation.operationId,
      error: error.message,
      result: null
    })
  }
}

/**
 * Retrieve job information
 * 
 * Route: GET /jobs/details/{job_id}
 * Tags: Jobs
 *
 * @param {string} job_id - No description (path)
 */
async function getJobDetails(req, res) {
  try {
    const jobService = new DatabaseService(Job);
    const { job_id } = req.params;
    const job = await jobService.findOne({ jobId: job_id });

    res.json({
      id: req.operation.operationId,
      error: null,
      result: {
        job
      }
    });

  } catch (error) {
    res.status(500).json({
      id: req.operation.operationId,
      error: error.message,
      result: null
    })

  }
}

/**
 * Submit job application
 * Apply to a job using query parameters
 * Route: GET /applications/submit
 * Tags: Applications
 *
 * @param {string} job_id - No description (query)
 * @param {string} full_name - No description (query)
 * @param {string} email - No description (query)
 * @param {string} phone_number - No description (query)
 * @param {integer} experience_years - No description (query)
 * @param {string} skills - No description (query)
 * @param {string} resume_url - No description (query)
 * @param {string} cover_letter - No description (query)
 */
async function applyToJob(req, res) {
  try {
    const { job_id, name, age, gender, phone, address } = req.query;
    const applicationService = new DatabaseService(Application);

    const application = await applicationService.create({
      job_id,
      name,
      age,
      gender,
      phone,
      address,
      "application_id": uuidv4(),
      "status": "PENDING"
    });

    res.json({
      id: req.operation.operationId,
      error: null,
      result: {
        application
      }
    });
  } catch (error) {
    res.status(500).json({
      id: req.operation.operationId,
      error: error.message,
      result: null
    })
  }
}

/**
 * List all job applications
 * 
 * Route: GET /applications/list
 * Tags: Applications
 
 */
async function getAllApplications(req, res) {
  try {
    const applicationService = new DatabaseService(Application);
    const applications = await applicationService.search({}, {});
    res.json({
      id: req.operation.operationId,
      error: null,
      result: {
        applications
      }
    });
  } catch (error) {
    res.status(500).json({
      id: req.operation.operationId,
      error: error.message,
      result: null
    })
  }
}

async function fetchApplicationById(req, res) {
  try {
    const applicationService = new DatabaseService(Application);
    const { application_id } = req.params;
    const application = await applicationService.findOne({ application_id: application_id });

    if (!application) {
      return res.status(404).json({
        id: req.operation.operationId,
        error: 'Application not found',
        result: null
      });
    }

    res.json({
      id: req.operation.operationId,
      error: null,
      result: {
        application
      }
    });

  } catch (error) {
    res.status(500).json({
      id: req.operation.operationId,
      error: error.message,
      result: null
    });
  }
}

module.exports = {
  searchJobs,
  getJobDetails,
  applyToJob,
  getAllApplications,
  fetchApplicationById
};
