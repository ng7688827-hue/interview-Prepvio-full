import { Router } from "express";
import {
  getInterviewQuestion,
  generateCodingProblem
} from "../controllers/interviewController.js";

const router = Router();

// Normal AI interview Q&A
router.post("/ask", getInterviewQuestion);

// Coding problem generator
router.post("/fireworks", generateCodingProblem);

export default router;
