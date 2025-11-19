import userModel from '../models/user.model.js';
import transactionModel from '../models/transactions.model.js';
import balanceModel from '../models/balance.model.js';

// Get all users (Admin only)
const getAllUsersAdmin = async (req, res) => {
  try {
    const users = await userModel
      .find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message,
    });
  }
};

// Get user details by ID (Admin only)
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userModel.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user's transaction count
    const transactionCount = await transactionModel.countDocuments({
      user_id: userId,
    });

    // Get user's balance
    const balance = await balanceModel.findOne({ user_id: userId });

    res.status(200).json({
      success: true,
      user,
      transactionCount,
      balance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user details',
      error: error.message,
    });
  }
};

// Update user admin status (Super Admin only)
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;
    console.log(isAdmin);
    const user = await userModel
      .findByIdAndUpdate(userId, { isAdmin }, { new: true })
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${isAdmin ? 'promoted to' : 'removed from'} admin role`,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
      error: error.message,
    });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Delete user's transactions
    await transactionModel.deleteMany({ user_id: userId });

    // Delete user's balance
    await balanceModel.deleteOne({ user_id: userId });

    // Delete user
    const user = await userModel.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User and associated data deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message,
    });
  }
};

// Get application statistics (Admin only)
const getAppStats = async (req, res) => {
  try {
    const totalUsers = await userModel.countDocuments({});
    const totalAdmins = await userModel.countDocuments({ isAdmin: true });
    const totalTransactions = await transactionModel.countDocuments({});

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await userModel.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get transaction stats by type
    const incomeTransactions = await transactionModel.countDocuments({
      type: 'income',
    });
    const expenseTransactions = await transactionModel.countDocuments({
      type: 'expense',
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        totalTransactions,
        recentUsers,
        incomeTransactions,
        expenseTransactions,
        regularUsers: totalUsers - totalAdmins,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching app statistics',
      error: error.message,
    });
  }
};

export {
  getAllUsersAdmin,
  getUserById,
  updateUserRole,
  deleteUser,
  getAppStats,
};
