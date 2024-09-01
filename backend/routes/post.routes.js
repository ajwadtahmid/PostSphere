import express from "express";
import { getAllPosts, getLikedPosts, getFeedPosts, getUserPosts, createPost, deletepost, commentOnPost, likeUnlikePost } from "../controllers/post.controller.js"
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/all", protectRoute, getAllPosts)
router.get("/feed", protectRoute, getFeedPosts)
router.get("/user/:username", protectRoute, getUserPosts)
router.get("/likes/:id", protectRoute, getLikedPosts)
router.post("/create", protectRoute, createPost);
router.post("/like/:id", protectRoute, likeUnlikePost);
router.post("/comment/:id", protectRoute, commentOnPost);
router.delete("/:id", protectRoute, deletepost);

export default router;