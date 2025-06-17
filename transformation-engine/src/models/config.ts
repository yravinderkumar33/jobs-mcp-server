import { AxiosRequestConfig } from "axios";

export interface CompanyConfig {
    id: string;
    name?: string;
    host: any;
    metadata?: Record<string, any>;
    search: SearchConfig;
    apply: Record<string, any>;
}

export interface SearchConfig {
    api: AxiosRequestConfig;
    responseSchema?: Record<string, any>;
    schema?: Record<string, any>;
    extractJobs(response: any): any[];
}