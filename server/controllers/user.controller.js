import userModel from '../models/user.model.js';

const getAllUsers = async (req, res) => {
  try {
    let users = await userModel.find();
    return res.status(200).json({
      message: 'Users fetched successfully',
      success: true,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error fetching users',
      success: false,
      error: error.message,
    });
  }
};

const postUser = async (req, res) => {
  try {
    let { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'All fields are required',
        success: false,
      });
    }
    let existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: 'User already exists',
        success: false,
      });
    }

    let newUser = new userModel({ name, email, password });
    await newUser.save();
    return res.status(201).json({
      message: 'User created successfully',
      success: true,
      user: newUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error creating user',
      success: false,
      error: error.message,
    });
  }
};

export { getAllUsers, postUser };
