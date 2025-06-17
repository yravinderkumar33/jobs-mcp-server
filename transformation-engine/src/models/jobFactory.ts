import mongoose from 'mongoose';
import config from '../config';

const jobCategories = config.jobCategories;

const createJobSchema = () => {
    return new mongoose.Schema(
        {},
        {
            strict: false,
            timestamps: true
        }
    );
};

const createJobModels = () => {
    const models: { [key: string]: mongoose.Model<any> } = {};

    jobCategories.forEach((category: string) => {
        const schema = createJobSchema();
        const modelName = `${category}_Job`;
        models[category] = mongoose.model(modelName, schema);
    });

    return models;
};

export const jobModels = createJobModels();

export const getJobModel = (categoryName: string): mongoose.Model<any> => {
    const upperCaseCategory = categoryName.toUpperCase();

    if (!jobModels[upperCaseCategory]) {
        throw new Error(`Invalid job category: ${categoryName}. Available categories: ${Object.keys(jobModels).join(', ')}`);
    }

    return jobModels[upperCaseCategory];
};





