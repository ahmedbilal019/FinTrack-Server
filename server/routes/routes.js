import { getAllUsers, postUser } from '../controllers/user.controller.js';
import {
  getBalancesByUser,
  postBalance,
} from '../controllers/balance.controller.js';
import {
  addIncome,
  getIncomesByUser,
} from '../controllers/income.controller.js';
import { registerUser, login } from '../controllers/auth.js';
import express from 'express';
import { AuthenticateUser } from '../middleware/authmiddleware.js';
import {
  addTransaction,
  deleteTransaction,
  getTransactionsByUser,
  updateTransaction,
} from '../controllers/transaction.controller.js';
import { get } from 'mongoose';
import { getTransactionByMonth } from '../controllers/reports.controller.js';
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

// User Routes Protected by Authentication Middleware
// TODO:Delete User based on ROLE
router.get('/users', AuthenticateUser, getAllUsers);
router.post('/users/add', AuthenticateUser, postUser);

router.get('/users/:user_id/balances', AuthenticateUser, getBalancesByUser);
router.post('/users/:user_id/balances/add', AuthenticateUser, postBalance);
router.get('/users/:user_id/incomes', AuthenticateUser, getIncomesByUser);
router.post('/users/:user_id/incomes/add', AuthenticateUser, addIncome);
// Transaction Routes
router.get(
  '/users/:user_id/transactions',
  AuthenticateUser,
  getTransactionsByUser
);
router.post('/users/transactions/add', AuthenticateUser, addTransaction);
router.delete(
  '/users/transactions/delete/:transaction_id',
  AuthenticateUser,
  deleteTransaction
);
router.put(
  '/users/transactions/update/:transaction_id',
  AuthenticateUser,
  updateTransaction
);
router.get('/users/reports/transactions/:user_id/:monthsNumber', AuthenticateUser, getTransactionByMonth);

export default router;
