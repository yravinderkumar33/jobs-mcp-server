import { Request, Response } from 'express';
import Job from '../models/Job';
import JobToCategoryMappingSchema from '../models/JobToCategoryMapping';
import { getJobModel } from '../models/jobFactory';
import { AdapterFactory, BaseJobProviderAdapter } from '../adapters';
import configuration from '../config';
import mongoose from 'mongoose';



export class Controller {

  private static adapters: Map<string, BaseJobProviderAdapter> = AdapterFactory.createAllAdapters(configuration.companies);

  private static async fetchJobs(ctx: any = {}): Promise<any[]> {
    const { filters = {}, options = {}, projections = {} } = ctx;
    console.log('fetchJobs called with filters:', JSON.stringify(filters));

    try {
      const jobToCategoryMapping = await JobToCategoryMappingSchema.find(filters, projections, options);
      console.log(`Found ${jobToCategoryMapping.length} jobToCategoryMapping records`);

      const jobs = [];

      for (const payload of jobToCategoryMapping) {
        try {
          const category = payload.category;
          console.log(`Processing job with category: ${category}, jobId: ${payload.jobId}`);

          const model = getJobModel(category);

          const job = await model.findOne({ jobId: payload.jobId }).lean();

          if (job) {
            jobs.push({
              category: category,
              jobId: payload.jobId,
              job: job,
              source_id: payload.source_id,
            });
            console.log(`Successfully found job for jobId: ${payload.jobId}`);
          } else {
            console.warn(`Job not found in ${category} collection for jobId: ${payload.jobId}`);
          }
        } catch (jobError) {
          console.error(`Error processing job category ${payload.category} with jobId ${payload.jobId}:`, jobError);
        }
      }

      console.log(`fetchJobs returning ${jobs.length} jobs`);
      return jobs;
    } catch (error) {
      console.error('Error in fetchJobs:', error);
      throw error;
    }
  }

  static async searchJobs(req: Request, res: Response): Promise<void> {
    try {
      const jobs = await Controller.fetchJobs();

      res.json({
        error: null,
        result: {
          jobs
        }
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        result: null
      });
    }
  }

  static async getJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        res.status(400).json({
          error: 'Job ID is required',
          result: null
        });
        return;
      }

      console.log(`Searching for job with ID: ${jobId}`);
      const jobs = await Controller.fetchJobs({ filters: { jobId } });
      console.log(`Found ${jobs.length} jobs for jobId: ${jobId}`);

      if (jobs.length === 0) {
        // Try searching by MongoDB ObjectId in case the jobId is an ObjectId
        console.log(`Trying to search by ObjectId: ${jobId}`);
        const jobsByObjectId = await Controller.fetchJobs({ filters: { jobId } });
        console.log(`Found ${jobsByObjectId.length} jobs by ObjectId`);

        if (jobsByObjectId.length === 0) {
          res.status(404).json({
            error: 'Job not found',
            result: null
          });
          return;
        }

        const job = jobsByObjectId[0];
        res.json({
          error: null,
          result: {
            job: job
          }
        });
        return;
      }

      const job = jobs[0];

      res.json({
        error: null,
        result: {
          job: job
        }
      });
    } catch (error) {
      console.error('Error in getJob:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        result: null
      });
    }
  }

  static async applyToJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        res.status(400).json({
          error: 'Job ID is required',
          result: null
        });
        return;
      }

      const jobs = await Controller.fetchJobs({ filters: { jobId: jobId } });

      if (jobs.length === 0) {
        res.status(404).json({
          error: 'Job not found',
          result: null
        });
        return;
      }

      const job = jobs[0];

      const adapter = Controller.adapters.get(job.source_id);

      if (!adapter) {
        res.status(404).json({
          error: 'Adapter not found',
          result: null
        });
        return;
      }

      const response = await adapter.applyToJob({
        jobId: jobId,
        payload: req.body
      });

      res.json({
        error: null,
        result: {
          job: response
        }
      })

    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getJobApplications(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        message: 'Jobs',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

} 