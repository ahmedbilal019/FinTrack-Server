import transactionModel from '../models/transactions.model.js';

export const addTransaction = async (req, res) => {
  try {
    let { user_id, date, amount, type, category, source } = req.body;
    if (!user_id || !type || !category || !amount || !date || !source) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newTransaction = new transactionModel({
      user_id,
      type,
      category,
      date: new Date(date),
      amount,
      source,
    });

    await newTransaction.save();
    res.status(201).json({
      message: 'Transaction added successfully',
      transaction: newTransaction,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding transaction', error });
  }
};

export const getTransactionsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const transactions = await transactionModel.find({ user_id });
    res.status(200).json({ transactions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error });
  }
};
// export const getTransactionSummary = async (req, res) => {
//   try {
//     const { user_id } = req.params;
//     const transactions = await transactionModel.find({ user_id });
//     const summary = transactions.reduce((acc, transaction) => {
//       if (transaction.type === 'Income') {
//         acc.totalIncome += transaction.amount;
//       } else {
//         acc.totalExpenses += transaction.amount;
//       }
//       return acc;
//     }, { totalIncome: 0, totalExpenses: 0 });

//     res.status(200).json({ summary });
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching transaction summary', error });
//   }
// };
