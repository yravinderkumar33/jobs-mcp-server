import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableParallel, RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

import config from "../config";

// Types and interfaces
interface JobCategoryInput {
    data: string;
}

interface JobNormalizationInput {
    data: string;
    inputSchema: string;
    outputSchema: string;
}

interface TransformationResult {
    category: string;
    job: Record<string, any>;
}

interface CategoryChainInput {
    data: string;
    jobCategories: string;
}

// Constants
const MODEL_CONFIG = {
    modelName: "gpt-4",
    temperature: 0,
} as const;

const DEFAULT_CATEGORY = "OTHER";

const CATEGORY_PROMPT_TEMPLATE = `
Given this job payload, categorize it into one of the following categories.

Return only the category name in UPPERCASE. If the job payload does not match any of the categories, return "OTHER".

Job payload: {data}
Categories: {jobCategories}
`;

const JOB_NORMALIZATION_PROMPT_TEMPLATE = `
You are a data transformation engine for blue-collar job data normalization. Your task is to transform input data from one JSON schema to another.

INSTRUCTIONS:
1. Analyze the input data structure using the provided inputSchema
2. Transform the data to match the outputSchema exactly
3. Preserve all meaningful information during transformation
4. Apply appropriate data type conversions when needed
5. Use null for missing required fields that cannot be inferred
6. Ensure the output strictly conforms to the outputSchema

IMPORTANT:
- Return ONLY valid JSON without any explanation, markdown, or additional text
- The output must validate against the outputSchema
- Maintain data integrity and accuracy throughout the transformation

INPUT DATA:
{data}

INPUT SCHEMA:
{inputSchema}

OUTPUT SCHEMA:
{outputSchema}
`;

// Utility functions
/**
 * Safely parses JSON string with error handling
 * @param jsonString - The JSON string to parse
 * @returns Parsed JSON object or throws descriptive error
 */
const safeJsonParse = (jsonString: string): Record<string, any> => {
    try {
        const trimmedString = jsonString.trim();
        return JSON.parse(trimmedString);
    } catch (error) {
        console.error('Failed to parse JSON:', jsonString);
        throw new Error(`Invalid JSON response from model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Transforms input data for category chain processing
 * @param input - The job category input data
 * @returns Formatted input for the category chain
 */
const prepareCategoryInput = (input: JobCategoryInput): CategoryChainInput => ({
    data: input.data,
    jobCategories: config.jobCategories.join(", ")
});

// Initialize the OpenAI model
const openAiModel = new ChatOpenAI(MODEL_CONFIG);

// Create prompt templates
const categoryPromptTemplate = PromptTemplate.fromTemplate(CATEGORY_PROMPT_TEMPLATE);
const jobNormalizationPromptTemplate = PromptTemplate.fromTemplate(JOB_NORMALIZATION_PROMPT_TEMPLATE);

/**
 * Chain for categorizing job data into predefined categories
 */
const categoryChain = RunnableSequence.from([
    prepareCategoryInput,
    categoryPromptTemplate,
    openAiModel,
    new StringOutputParser(),
]);

/**
 * Chain for normalizing job data according to specified schemas
 */
const jobNormalizationChain = RunnableSequence.from([
    jobNormalizationPromptTemplate,
    openAiModel,
    new StringOutputParser(),
    safeJsonParse
]);

/**
 * Main transformation chain that processes job data in parallel
 * - Categorizes the job
 * - Normalizes the job data structure
 */
const transformationChain = RunnableParallel.from({
    category: categoryChain,
    job: jobNormalizationChain
});

export default transformationChain;

export type { JobCategoryInput, JobNormalizationInput, TransformationResult };
