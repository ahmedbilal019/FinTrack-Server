import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { sendLoginElert } from "../utils/mail.js";
dotenv.config();

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Validation
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "All fields are required", success: false });
    }
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
        success: false,
      });
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists", success: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({ name, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign(
      {
        user_id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        currency: newUser.currency,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    // await sendLoginElert(email);
    return res.status(201).json({
      message: "User registered successfully",
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        currency: newUser.currency,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error registering user",
      success: false,
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }
    // Check if user exists
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
        success: false,
      });
    }
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
        success: false,
      });
    }
    // JWT Token Generation

    let token = jwt.sign(
      {
        user_id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    await sendLoginElert(email);
    return res.status(201).json({
      message: "Login successful",
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
      },
      token: token,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error logging in user",
      success: false,
      error: error.message,
    });
  }
};

export { registerUser, login };
