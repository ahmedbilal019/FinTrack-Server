import transactionModel from '../models/transactions.model.js';
import balanceModel from '../models/balance.model.js';

export const addTransaction = async (req, res) => {
  try {
    let { user_id, date, amount, type, category, source } = req.body;
    if (!user_id || !type || !category || !amount || !date || !source) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    // validate input fields
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
      date: new Date(date).toISOString(),
      amount,
      source,
    });

    await newTransaction.save();
    // Update balance
    const previousBalanceEntry = await balanceModel
      .findOne({
        user_id,
        balanceType: source,
        date: { $lte: new Date(date).toISOString() },
      })
      .sort({ date: -1 });
    let newBalanceAmount = previousBalanceEntry
      ? previousBalanceEntry.amount
      : 0;

    newBalanceAmount =
      type === 'income' ? newBalanceAmount + amount : newBalanceAmount - amount;

    await balanceModel.create({
      user_id,
      trans_id: newTransaction._id,
      balanceType: source,
      amount: newBalanceAmount,
      date: new Date(date).toISOString(),
    });
    await balanceModel.updateMany(
      {
        user_id,
        balanceType: source,
        date: { $gt: new Date(date).toISOString() },
      },
      {
        $inc: { amount: newBalanceAmount },
      }
    );
    res.status(200).json({
      message: 'Transaction added successfully',
      transaction: newTransaction,
      success: true,
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
    const { user_id, transaction_id } = req.params;

    // Get the transaction first before deleting
    const deletedTransaction = await transactionModel.findByIdAndDelete(
      transaction_id
    );
    if (!deletedTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    const impact =
      deletedTransaction.type === 'income'
        ? -deletedTransaction.amount
        : deletedTransaction.amount;

    await balanceModel.findOneAndDelete({ trans_id: deletedTransaction._id });
    // Update balances after deletion
    await balanceModel.updateMany(
      {
        user_id,
        balanceType: deletedTransaction.source,
        date: { $gte: deletedTransaction.date },
      },
      {
        $inc: { amount: impact },
      }
    );

    res.status(200).json({
      message: 'Transaction deleted successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error in deleteTransaction:', error);
    res.status(500).json({
      message: 'Error deleting transaction',
      error: error.message,
      success: false,
    });
  }
};
export const updateTransaction = async (req, res) => {
  try {
    const { transaction_id } = req.params;
    let { date, amount, type, category, source } = req.body;

    // Validate input
    if (!date || !amount || !type || !category || !source) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Normalize and validate
    type = type.toLowerCase();
    category = category.toLowerCase();
    amount = parseFloat(amount);

    if (isNaN(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ message: 'Amount must be a positive number' });
    }

    // Get the original transaction
    const oldTransaction = await transactionModel.findById(transaction_id);
    if (!oldTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    console.log('Original transaction:', oldTransaction);

    const oldImpact =
      oldTransaction.type === 'income'
        ? oldTransaction.amount
        : -oldTransaction.amount;

    // Delete old balance
    await balanceModel.findOneAndDelete({ trans_id: transaction_id });
    // then update balances
    await balanceModel.updateMany(
      {
        user_id: oldTransaction.user_id,
        balanceType: oldTransaction.source,
        date: { $gt: oldTransaction.date },
      },
      { $inc: { amount: -oldImpact } }
    );

    //update transaction
    const updatedTransaction = await transactionModel.findByIdAndUpdate(
      transaction_id,
      {
        date: new Date(date).toISOString(),
        amount,
        type,
        category,
        source,
      },
      { new: true }
    );

    // new balances
    const newImpact = type === 'income' ? amount : -amount;
    const newDateISO = new Date(date).toISOString();
    // fetch recent balance
    const previousBalanceEntry = await balanceModel
      .findOne({
        user_id: updatedTransaction.user_id,
        balanceType: source,
        date: { $lte: newDateISO },
      })
      .sort({ date: -1 });

    const previousAmount = previousBalanceEntry
      ? previousBalanceEntry.amount
      : 0;
    const newEntryAmount = parseFloat((previousAmount + newImpact).toFixed(2));

    // Create the new balance entry
    await balanceModel.create({
      user_id: updatedTransaction.user_id,
      trans_id: updatedTransaction._id,
      balanceType: source,
      amount: newEntryAmount,
      date: newDateISO,
    });

    // Apply the impact to all FUTURE balances for the NEW source
    await balanceModel.updateMany(
      {
        user_id: updatedTransaction.user_id,
        balanceType: source,
        date: { $gt: newDateISO },
      },
      { $inc: { amount: newImpact } }
    );

    res.status(200).json({
      message: 'Transaction updated successfully',
      transaction: updatedTransaction,
      success: true,
    });
  } catch (error) {
    console.error('Error in updateTransaction:', error);
    res.status(500).json({
      message: 'Error updating transaction',
      error: error.message,
      success: false,
    });
  }
};
