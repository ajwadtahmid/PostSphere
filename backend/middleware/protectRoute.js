import User from '../models/user.model.js';
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if(!token){
            res.status(401).json({error: "No token provided. Unauthorized"})
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(!decoded){
            res.status(401).json({error: "Invalid token. Unauthorized"})
        }
        const user = await User.findById(decoded.userId).select("-password") //get user info minus the password
        if(!user){
            res.status(401).json({error: "User not found. Unauthorized"})
        }
        req.user = user;
        next();
    } catch (error) {
        console.log("error in protectRoute middleware", error.message);
        return res.status(400).json({error: "Internal Server error"});
    }
}