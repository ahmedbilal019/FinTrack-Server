import {
  getAllUsers,
  resetDataFromTransactionandBalance,
  updateUser,
} from '../controllers/user.controller.js';
import { getBalancesByUser } from '../controllers/balance.controller.js';

import { registerUser, login } from '../controllers/auth.js';
import express from 'express';
import { AuthenticateUser, isAdminAuth } from '../middleware/authmiddleware.js';
import {
  addTransaction,
  deleteTransaction,
  getTransactionsByUser,
  updateTransaction,
} from '../controllers/transaction.controller.js';
import {
  getBalanceOverTime,
  getTransactionReport,
} from '../controllers/reports.controller.js';
import {
  getAllUsersAdmin,
  getUserById,
  updateUserRole,
  deleteUser,
  getAppStats,
} from '../controllers/admin.controller.js';

const router = express.Router();
router.post('/auth/register', registerUser);
router.post('/auth/login', login);
router.get('/auth/verify', AuthenticateUser, (req, res) => {
  res.status(200).json({
    message: 'Authentication successful',
    success: true,
    user: {
      id: req.user.user_id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});

// Admin Routes (add these to your existing routes)
router.get('/admin/users', isAdminAuth, getAllUsersAdmin);
router.get('/admin/users/:userId', isAdminAuth, getUserById);
router.put('/admin/users/:userId/role', isAdminAuth, updateUserRole);
router.delete('/admin/users/:userId', isAdminAuth, deleteUser);
router.get('/admin/stats', isAdminAuth, getAppStats);

// User Routes Protected by Authentication Middleware
router.get('/users', AuthenticateUser, getAllUsers);
router.get('/users/:user_id/balances', AuthenticateUser, getBalancesByUser);
router.get(
  '/users/reset/:user_id',
  AuthenticateUser,
  resetDataFromTransactionandBalance
);
router.put('/users/update/:id', AuthenticateUser, updateUser);
// Transaction Routes
router.get(
  '/users/:user_id/transactions',
  AuthenticateUser,
  getTransactionsByUser
);
router.post(
  '/users/:user_id/transactions/add',
  AuthenticateUser,
  addTransaction
);

router.delete(
  '/users/:user_id/transactions/delete/:transaction_id',
  AuthenticateUser,
  deleteTransaction
);
router.put(
  '/users/:user_id/transactions/update/:transaction_id',
  AuthenticateUser,
  updateTransaction
);

// Reports Routes
router.get(
  '/users/reports/transactions/:user_id/:monthsNumber',
  AuthenticateUser,
  getTransactionReport
);
router.get(
  '/users/reports/balances/:user_id/:monthsNumber/:balanceType',
  AuthenticateUser,
  getBalanceOverTime
);

// router.get(
//   '/users/reports/transactions/current/:user_id',
//   AuthenticateUser,
//   currentMonthTransactionSummary
// );
export default router;
