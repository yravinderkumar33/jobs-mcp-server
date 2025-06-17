import mongoose, { Document, Schema } from 'mongoose';

export interface IJobToCategoryMapping extends Document {
  [key: string]: any;
}

const JobToCategoryMappingSchema: Schema = new Schema(
  {},
  {
    strict: false,
    timestamps: true
  }
);

export default mongoose.model<IJobToCategoryMapping>('JobToCategoryMapping', JobToCategoryMappingSchema); 