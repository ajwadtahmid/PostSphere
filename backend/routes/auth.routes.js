import express from "express";
import { signup, authcheck, login, logout } from "../controllers/auth.controller.js"
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/signup", signup);
router.get("/authcheck", protectRoute, authcheck);
router.post("/login", login);
router.post("/logout", logout);

export default router;