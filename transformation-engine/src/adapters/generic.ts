import axios from "axios";
import { BaseJobProviderAdapter } from "./base";
import { NormalizedJob } from "../models/adapter";
import { CompanyConfig } from "../models/config";
import chain from "../runnables";
import Job from '../models/Job';
import { connectToMongoDB } from '../utils/mongoConnection';
import { getJobModel } from "../models/jobFactory";
import JobToCategoryMappingSchema from "../models/JobToCategoryMapping";
import { query } from "express";

connectToMongoDB();
export class GenericJobProviderAdapter extends BaseJobProviderAdapter {
    readonly providerId: string;

    constructor(companyConfig: CompanyConfig, normalizedSchema?: any) {
        super(companyConfig, normalizedSchema);
        this.providerId = companyConfig.id;
    }

    async searchJobs(params: Record<string, any> = {}): Promise<any[]> {
        try {
            console.log(`📡 Fetching data from ${this.config.name || this.providerId}...`);
            const response = await axios(this.config.search.api);
            const jobs: any[] = this.config.search.extractJobs(response);
            return jobs;
        } catch (error) {
            console.error(`❌ Error searching jobs from ${this.config.name || this.providerId}:`, error);
            throw error;
        }
    }

    async applyToJob(context: any): Promise<any> {
        try {
            console.log(context)
            const { jobId, payload = {} } = context;
            if (this.providerId === 'yadav_consulting') {
                const url = this.config.apply.api.url;
                const response = await axios.get(url, {
                    params: {
                        job_id: jobId,
                        name: payload.name,
                        age: payload.age,
                        gender: payload.gender,
                        phone: payload.phone,
                        address: payload.address
                    }
                });
                return response.data;
            } else if (this.providerId === 'rozgaar_setu') {
                const url = this.config.apply.api.url.replace('{jobId}', jobId);
                const response = await axios.post(url, {
                    "applicant": {
                        "name": payload.name,
                        "phone": payload.phone,
                        "email": payload.email
                    },
                    "status": "PENDING"
                });
                return response.data;
            }

        } catch (error) {
            console.error(`❌ Error applying to job from ${this.config.name || this.providerId}:`);
            throw error;
        }
    }


    async normalizeJob(jobs: Record<string, any>[]): Promise<NormalizedJob[]> {
        const output: NormalizedJob[] = [];

        for (const job of jobs) {
            try {

                const chainOutput = await chain.invoke({
                    data: JSON.stringify(job),
                    inputSchema: JSON.stringify(this.config.search.schema),
                    outputSchema: JSON.stringify(this.normalizedSchema || this.config.search.schema)
                });

                const jobCategory = chainOutput.category as string;
                const normalizedJob = chainOutput.job as Record<string, any>;

                const model = getJobModel(jobCategory);
                const jobDocument = new model(normalizedJob);
                await jobDocument.save();

                const jobToCategoryMapping = new JobToCategoryMappingSchema({
                    jobId: jobDocument.jobId,
                    category: jobCategory,
                    source_id: this.providerId,
                    original_event: job
                });

                await jobToCategoryMapping.save();

                console.log('Job saved to MongoDB:', jobDocument.jobId);
                output.push(normalizedJob);
            } catch (transformError) {
                console.error(`⚠️  Error transforming job from ${this.providerId}:`, transformError);
            }
        }

        console.log(`✨ Successfully transformed ${output.length} jobs from ${this.config.name || this.providerId}`);
        return output;
    }
} 