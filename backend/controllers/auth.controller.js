import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

export const signup = async (req, res) => {
    try {
        const { fullName, username, email, password} = req.body;
        const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        if (!emailRegex.test(email)){
            return res.status(400).json({error: "Invalid email format"});
        }

        const existingUser = await User.findOne({username});
        if (existingUser){
            return res.status(400).json({error: "Username taken"});
        }

        const existingEmail = await User.findOne({email});
        if (existingEmail){
            return res.status(400).json({error: "Email taken"});
        }
        
        if(password.length < 8){
            return res.status(400).json({error: "Password must be at least 8 charecter long"});
        }
        // password hashing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const newUser = new User ({
            fullName,
            username,
            email, 
            password: hashedPassword
        })

        if (newUser){
            generateTokenAndSetCookie(newUser._id,res)
            await newUser.save();
            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                followers: newUser.followers,
                following: newUser.following,
                profileImg: newUser.profileImg,
                coverImg: newUser.coverImg
            });
        }
        else{
            res.status(400).json({error: "Invalid user data"});
        }

    } catch (error) {
        console.log("error in signup controller", error.message);
        return res.status(400).json({error: "Internal Server error"});
    }
};

export const login = async (req, res) => {
    try {
        const {username,password} = req.body;
        const user = await User.findOne({username});
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "")
        
        if(!user || !isPasswordCorrect){
            return res.status(400).json({error: "Invalid credentials"});
        }
        generateTokenAndSetCookie(user._id,res)

		res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			username: user.username,
			email: user.email,
			followers: user.followers,
			following: user.following,
			profileImg: user.profileImg,
			coverImg: user.coverImg,
		});
    } catch (error) {
        console.log("error in login controller", error.message);
        return res.status(400).json({error: "Internal Server error"});
    }
}

export const logout = async (req, res) => {
    try {
        // reset cookie
        res.cookie("jwt","",{maxAge:0})
        res.status(200).json({message: "Logged out successfully"});
    } catch (error) {
        console.log("error in logout controller", error.message);
        return res.status(400).json({error: "Internal Server error"});
    }
}


export const authcheck = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password")
        res.status(200).json(user);
    } catch (error) {
        console.log("error in logout authcheck", error.message);
        return res.status(400).json({error: "Internal Server error"});
    }
}