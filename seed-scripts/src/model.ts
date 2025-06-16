import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  [key: string]: any;
}

const JobSchema: Schema = new Schema(
  {},
  { strict: false }
);

export default mongoose.model<IJob>('Job', JobSchema); 