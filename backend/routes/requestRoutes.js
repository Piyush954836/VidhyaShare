import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  createRequest,
  getUserRequests,
  getProviderRequests,
  updateRequestStatus,
} from "../controllers/requestController.js";

const router = express.Router();

// Create a new request
router.post("/", authenticate, createRequest);

// Get requests made by logged-in user
router.get("/my-requests", authenticate, getUserRequests);

// Get requests for provider's skills
router.get("/provider-requests", authenticate, getProviderRequests);

// Update request status (accept/reject)
router.patch("/status", authenticate, updateRequestStatus);

export default router;
