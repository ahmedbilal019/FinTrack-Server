import balanceModel from '../models/balance.model.js';
import transactionModel from '../models/transactions.model.js';
import bcrypt from 'bcryptjs';
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

// const postUser = async (req, res) => {
//   try {
//     let { name, email, password } = req.body;
//     if (!name || !email || !password) {
//       return res.status(400).json({
//         message: 'All fields are required',
//         success: false,
//       });
//     }
//     let existingUser = await userModel.findOne({ email });
//     if (existingUser) {
//       return res.status(409).json({
//         message: 'User already exists',
//         success: false,
//       });
//     }

//     let newUser = new userModel({ name, email, password });
//     await newUser.save();
//     return res.status(201).json({
//       message: 'User created successfully',
//       success: true,
//       user: newUser,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: 'Error creating user',
//       success: false,
//       error: error.message,
//     });
//   }
// };
const updateUser = async (req, res) => {
  // Implementation for updating a user's currency preference
  try {
    let { id } = req.params;
    let { email, password, currentPassword, currency } = req.body;
    let updatedFields = {};
    
    if (email !== '') {
      updatedFields.email = email;
    }
    if (password !== '') {
      const user = await userModel.findById(id);
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({
          message: 'Current password is incorrect',
          success: false,
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedFields.password = hashedPassword;
    }
    if (currency !== '') {
      updatedFields.currency = currency;
    }
    let updatedUser = await userModel.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        message: 'User not found',
        success: false,
      });
    }

    return res.status(200).json({
      message: 'User updated successfully',
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error updating user',
      success: false,
      error: error.message,
    });
  }
};
const resetDataFromTransactionandBalance = async (req, res) => {
  try {
    const { user_id } = req.params;
    // Delete all transactions for the user
    await transactionModel.deleteMany({ user_id });
    // Delete all balances for the user
    await balanceModel.deleteMany({ user_id });
  } catch (error) {
    throw new Error('Error resetting data: ' + error.message);
  }
  res.status(200).json({
    message: 'User data reset successfully',
    success: true,
  });
};

export { getAllUsers, updateUser, resetDataFromTransactionandBalance };
