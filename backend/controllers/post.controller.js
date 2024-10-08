import {v2 as cloudinary} from "cloudinary";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js"

export const createPost = async (req, res) => {
    try {
        const { text } = req.body;
        let { img } = req.body;
        const userId = req.user._id.toString();

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({error: "User not found"});
        }
        if(img){
            const uploadedResponse = await cloudinary.uploader(img);
            img = uploadedResponse.secure_url;
        }
        if(!text && !img){
            return res.status(404).json({error: "Post must have either text or image"});
        }

        const newPost = new Post({
            user:userId,
            text,
            img
        })

        await newPost.save();
        res.status(201).json(newPost)
    } catch (error) {
        console.log("error in createPost controller", error.message);
        return res.status(500).json({error: "Internal Server error"});
    }
};

export const deletepost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        if(!post){
            return res.status(404).json({error: "Post not found"});
        }
        if(post.user.toString() !== req.user._id.toString()){
            return res.status(401).json({error: "You are not authorized to delete this post"});
        }
        if(post.img){
            const imgId = post.img.split("/").pop().split(".")[0];
			await cloudinary.uploader.destroy(imgId);
        }
        await await Post.findByIdAndDelete(req.params.id);
        res.status(200).json({message: "Post deleted successfully"});
    } catch (error) {
        console.log("error in deletepost controller", error.message);
        return res.status(500).json({error: "Internal Server error"});
    }
};

export const commentOnPost = async (req, res) => {
    try {
        const { text } = req.body;
        const postId = req.params.id;
        const userId = req.user._id;
        
        if(!text){
            return res.status(400).json({error: "Text is required"});
        }

        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({error: "Post not found"});
        }

        const comment =  {user: userId, text}

        post.comments.push(comment);
        await post.save();
        return res.status(200).json(post);
    } catch (error) {
        console.log("error in commentOnPost controller", error.message);
        return res.status(500).json({error: "Internal Server error"});
    }
}

export const likeUnlikePost = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id:postId } = req.params;

        const post = await Post.findById(postId)
        
        if(!post){
            return res.status(404).json({error: "Post not found"});
        }
        
        const userLikedPost = post.likes.includes(userId);

        if(userLikedPost){
            // unlike the post
            await Post.updateOne({_id:postId},{$pull:{likes: userId}});
            await User.updateOne({_id:userId},{$pull:{likedPosts: postId}});
            // removes userId from likes
            const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());

            return res.status(200).json(updatedLikes);
        }
        else{
            // like the post
            post.likes.push(userId);
            await User.updateOne({_id:userId},{$push:{likedPosts: postId}});
            await post.save();

            const notification = new Notification({
                from: userId,
                to: post.user,
                type: "like"
            });
            await notification.save();

            const updatedLikes = post.likes;
            return res.status(200).json(updatedLikes);
        }

    } catch (error) {
        console.log("error in likeUnlikePost controller", error.message);
        return res.status(500).json({error: "Internal Server error"});
    }
}

export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({createdAt: -1})
        .populate({
            path: "user",
            select: "-password"
        })
        .populate({
            path: "comments.user",
            select: "-password"
        });

        if(posts.length === 0){
            return res.status(200).json([])
        }
        return res.status(200).json(posts)
    } catch (error) {
        console.log("error in getAllPosts controller", error.message);
        return res.status(500).json({error: "Internal Server error"});
    }
}

export const getLikedPosts = async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({error: "User not found!"})
        }
        const likedPosts = await Post.find({_id: {$in: user.likedPosts}})
        .populate({
            path: "user",
            select: "-password",
        })
        .populate({
            path: "user.comments",
            select: "-password"
        });
        res.status(200).json(likedPosts)
    } catch (error) {
        console.log("error in getLikedPosts controller", error.message);
        return res.status(500).json({error: "Internal Server error"});
    }
}

export const getFeedPosts = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId)
        if(!user){
            return res.status(404).json({error:"User not found"})
        }

        const following = user.following;

        const feedPost =  await Post.find({user: {$in: following}})
        .sort({createdAt: -1})
        .populate({
            path: "user",
            select: "-password"
        })
        .populate({
            path: "user.comments",
            select: "-password"
        });
        res.status(200).json(feedPost)
    } catch (error) {
        console.log("error in getFeedPosts controller", error.message);
        return res.status(500).json({error: "Internal Server error"});
    }
}


export const getUserPosts = async (req, res) => {
    try {
        const {username} = req.params;
        const user = await User.findOne({username});
        if(!user){
            return res.status(404).json({error: "User not found"})
        }

        const posts = await Post.find({user: user._id}).sort({createdAt: -1})
        .populate({
            path: "user",
            select: "-password"
        })
        .populate({
            path: "user.comments",
            select: "-password"
        });

        res.status(200).json(posts)
    } catch (error) {
        console.log("error in getUserPosts controller", error.message);
        return res.status(500).json({error: "Internal Server error"});
    }
}