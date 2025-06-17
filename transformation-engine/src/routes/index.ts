import { Router } from 'express';
import { Controller } from '../controllers';

const router = Router();

router.post('/jobs/search', Controller.searchJobs);
router.get('/jobs/:jobId', Controller.getJob);
router.post('/jobs/:jobId/apply', Controller.applyToJob);

export { router };