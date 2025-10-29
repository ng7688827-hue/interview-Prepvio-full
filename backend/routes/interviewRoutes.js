import { Router } from 'express';
import interviewController from '../controllers/interviewController.js';

const router = Router();

// POST /api/interview/ask
router.post('/ask', interviewController.getInterviewQuestion);

export default router;
