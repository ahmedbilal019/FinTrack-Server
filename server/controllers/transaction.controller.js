import transactionModel from '../models/transactions.model.js';
import balanceModel from '../models/balance.model.js';

export const addTransaction = async (req, res) => {
  try {
    let { user_id, date, amount, type, category, source } = req.body;
    if (!user_id || !type || !category || !amount || !date || !source) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    // Normalize and validate input fields
    type = type.toLowerCase();
    category = category.toLowerCase();
    amount = parseFloat(amount);
    if (isNaN(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ message: 'Amount must be a positive number' });
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
    // -------------------------------//

    // Update balance immediately after adding transaction
    let balance = await balanceModel.findOne({ user_id, balanceType: source });
    let currentAmount = balance ? balance.amount : 0;

    // Calculate new balance
    let updatedAmount =
      type === 'income' ? currentAmount + amount : currentAmount - amount;

    // If balance exists, update it; otherwise create new
    if (!balance) {
      balance = new balanceModel({
        user_id,
        balanceType: source,
        amount: updatedAmount,
        date: new Date().toISOString(),
      });
    } else {
      balance.amount = updatedAmount;
      balance.date = new Date().toISOString();
    }

    await balance.save();

    // -------------------------------//
    res.status(200).json({
      success: true,
      message: 'Transaction added successfully',
      transaction: newTransaction,
      balance: balance,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding transaction', error });
  }
};

export const getTransactionsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const transactions = await transactionModel
      .find({ user_id })
      .sort({ date: -1 });
    res.status(200).json({ transactions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { transaction_id } = req.params;

    const deletedTransaction = await transactionModel.findByIdAndDelete(
      transaction_id
    );
    // -------------updating balace on delete balance ---------------//
    if (!deletedTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // 2️⃣ Update balance immediately after deletion
    const balance = await balanceModel.findOne({
      user_id: deletedTransaction.user_id,
      balanceType: deletedTransaction.source,
    });
    console.log('deleted Transaction: ', deleteTransaction);
    console.log('Balance before update:', balance);
    if (balance) {
      // Reverse the effect of the deleted transaction
      balance.amount =
        deletedTransaction.type === 'income'
          ? balance.amount - deletedTransaction.amount
          : balance.amount + deletedTransaction.amount;

      await balance.save();
    }

    //------------------------///

    res.status(200).json({
      message: 'Transaction deleted successfully',
      transaction: deletedTransaction,
      // updated balance
      updatedBalance: balance,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting transaction', error });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { transaction_id } = req.params;
    const { date, amount, type, category, source } = req.body;

    if (!date || !amount || !type || !category || !source) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    //
    const oldTransaction = await transactionModel.findById(transaction_id);
    if (!oldTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // 🔹 Step 2: Find the balance of the OLD source
    const oldBalance = await balanceModel.findOne({
      user_id: oldTransaction.user_id,
      balanceType: oldTransaction.source,
    });
    if (oldBalance) {
      oldBalance.amount =
        oldTransaction.type === "income"
          ? oldBalance.amount - oldTransaction.amount // remove previous income
          : oldBalance.amount + oldTransaction.amount; // refund previous expense

      await oldBalance.save();
    }

    //

    const updatedTransaction = await transactionModel.findByIdAndUpdate(
      transaction_id,
      { date, amount, type, category, source },
      { new: true }
    );
    //
    const newBalance = await balanceModel.findOne({
      user_id: updatedTransaction.user_id,
      balanceType: updatedTransaction.source,
    });

    // 🔹 Step 6: APPLY the new transaction’s effect
    if (newBalance) {
      newBalance.amount =
        updatedTransaction.type === "income"
          ? newBalance.amount + updatedTransaction.amount // add new income
          : newBalance.amount - updatedTransaction.amount; // deduct new expense

      await newBalance.save();
    }
    //
    res.status(200).json({
      message: 'Transaction updated successfully',
      transaction: updatedTransaction,
      updatedBalance: newBalance,
      oldTransaction: oldTransaction,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating transaction', error });
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
