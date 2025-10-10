import express from "express";
import { signup, login, socialLoginRedirect, oauthExchange, me } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/social-login/:provider", socialLoginRedirect);  // Social login trigger
router.post("/oauth-exchange", oauthExchange);
router.get("/me", me);                       // Fetch current user

export default router;
