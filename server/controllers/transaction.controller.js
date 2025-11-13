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
      date: new Date(date).toISOString(),
      amount,
      source,
    });

    await newTransaction.save();
    // -------------------------------//

    let precedingTransactions = await transactionModel
      .find({
        user_id,
        source: source,
        date: { $gte: new Date(date).toISOString() },
      })
      .sort({ date: -1 });
    console.log('Preceding Transactions:', precedingTransactions);

    if (precedingTransactions.length === 1) {
      let precedingBalance = await balanceModel
        .findOne({
          user_id,
          balanceType: source,
        })
        .sort({ date: -1 });

      console.log('Preceding Balance: ', precedingBalance);
      let currentAmount = precedingBalance ? precedingBalance.amount : 0;
      // Calculate new balance
      let updatedAmount =
        type === 'income' ? currentAmount + amount : currentAmount - amount;
      console.log('Updated Ammount : ', updatedAmount);
      // Add New balance entry
      const transactionBalance = new balanceModel({
        user_id,
        trans_id: newTransaction._id,
        balanceType: source,
        amount: updatedAmount,
        date: new Date(date).toISOString(),
      });
      await transactionBalance.save();
    } else {
      // There are subsequent transactions, need to update their balances
      // First delete the existing balances for these transactions
      // Create new balance entries starting from the preceding balance
      let balanceAfterDate = await balanceModel
        .deleteMany({
          user_id,
          balanceType: source,
          date: { $gte: date },
        })
        .sort({ date: -1 });
      let precedingBalance = await balanceModel
        .findOne({
          user_id,
          balanceType: source,
        })
        .sort({ date: -1 });
      let currentAmount = precedingBalance ? precedingBalance.amount : 0;
      for (const tx of precedingTransactions.reverse()) {
        // Calculate new balance
        let updatedAmount =
          tx.type === 'income'
            ? currentAmount + tx.amount
            : currentAmount - tx.amount;
        currentAmount = updatedAmount;
        // Add New balance entry
        const transactionBalance = new balanceModel({
          user_id,
          trans_id: tx._id,
          balanceType: source,
          amount: updatedAmount,
          date: tx.date,
        });
        await transactionBalance.save();

        console.log('Updated balance for transaction:', updatedAmount);
      }
    }
    // Calculate new balance
    res.status(200).json({
      success: true,
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
    const deletedTransaction = await transactionModel.findById(transaction_id);
    if (!deletedTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Find the balance entry for this specific transaction
    const balanceToDelete = await balanceModel.findOne({
      user_id: deletedTransaction.user_id,
      trans_id: deletedTransaction._id,
    });

    if (!balanceToDelete) {
      return res
        .status(404)
        .json({ message: 'Balance entry not found for this transaction' });
    }

    console.log('Balance to delete:', balanceToDelete);

    // Calculate adjustment amount (reverse the transaction effect)
    const adjustmentAmount =
      deletedTransaction.type === 'income'
        ? -deletedTransaction.amount // Remove income effect
        : deletedTransaction.amount; // Remove expense effect (add back)

    // Get all balance entries after the deleted transaction's balance entry
    const subsequentBalances = await balanceModel
      .find({
        user_id: deletedTransaction.user_id,
        balanceType: deletedTransaction.source,
        date: { $gt: balanceToDelete.date },
      })
      .sort({ date: 1 });

    console.log(
      `Found ${subsequentBalances.length} subsequent balances to update`
    );

    for (const subsequentBalance of subsequentBalances) {
      subsequentBalance.amount = parseFloat(
        (subsequentBalance.amount + adjustmentAmount).toFixed(2)
      );
      await subsequentBalance.save();
      console.log(
        `Updated balance ${subsequentBalance._id}: ${subsequentBalance.amount}`
      );
    }

    // Delete the balance entry for this transaction
    await balanceModel.findByIdAndDelete(balanceToDelete._id);

    // Now delete the transaction
    await transactionModel.findByIdAndDelete(transaction_id);

    res.status(200).json({
      message: 'Transaction deleted successfully',
      transaction: deletedTransaction,
      deletedBalance: balanceToDelete,
      updatedBalances: subsequentBalances.length,
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

    // Find the balance entry for this specific transaction
    const oldBalance = await balanceModel.findOne({
      user_id: oldTransaction.user_id,
      trans_id: oldTransaction._id,
    });

    if (!oldBalance) {
      return res
        .status(404)
        .json({ message: 'Balance entry not found for this transaction' });
    }

    console.log('Old balance entry:', oldBalance);

    // Step 1: Calculate the effect of removing the old transaction
    const oldTransactionEffect =
      oldTransaction.type === 'income'
        ? -oldTransaction.amount
        : oldTransaction.amount;

    // Step 2: Calculate the effect of adding the new transaction
    const newTransactionEffect = type === 'income' ? amount : -amount;

    // Step 3: Calculate the net adjustment needed
    const netAdjustment =
      newTransactionEffect -
      (oldTransaction.type === 'income'
        ? oldTransaction.amount
        : -oldTransaction.amount);

    console.log('Net adjustment needed:', netAdjustment);

    // Step 4: Update the balance entry for this transaction
    oldBalance.amount = parseFloat(
      (oldBalance.amount + netAdjustment).toFixed(2)
    );
    oldBalance.date = new Date().toISOString(); // Update timestamp
    await oldBalance.save();

    console.log('Updated balance entry:', oldBalance);

    // Step 5: Update all subsequent balance entries with the net adjustment
    const subsequentBalances = await balanceModel
      .find({
        user_id: oldTransaction.user_id,
        balanceType: oldTransaction.source,
        date: { $gt: oldBalance.date },
      })
      .sort({ date: 1 });

    console.log(`Updating ${subsequentBalances.length} subsequent balances`);

    for (const balance of subsequentBalances) {
      balance.amount = parseFloat((balance.amount + netAdjustment).toFixed(2));
      await balance.save();
      console.log(
        `Updated subsequent balance ${balance._id}: ${balance.amount}`
      );
    }

    // Step 6: If the source (balanceType) changed, we need to handle cross-account transfers
    if (source !== oldTransaction.source) {
      // Remove effect from old source
      const oldSourceAdjustment =
        oldTransaction.type === 'income'
          ? -oldTransaction.amount
          : oldTransaction.amount;

      const oldSourceBalances = await balanceModel
        .find({
          user_id: oldTransaction.user_id,
          balanceType: oldTransaction.source,
          date: { $gt: oldBalance.date },
        })
        .sort({ date: 1 });

      for (const balance of oldSourceBalances) {
        balance.amount = parseFloat(
          (balance.amount + oldSourceAdjustment).toFixed(2)
        );
        await balance.save();
      }

      // Create new balance entry for the new source
      const latestNewSourceBalance = await balanceModel
        .findOne({
          user_id: oldTransaction.user_id,
          balanceType: source,
        })
        .sort({ date: -1 });

      const currentNewSourceAmount = latestNewSourceBalance
        ? latestNewSourceBalance.amount
        : 0;
      const newSourceBalanceAmount =
        type === 'income'
          ? currentNewSourceAmount + amount
          : currentNewSourceAmount - amount;

      const newSourceBalance = new balanceModel({
        user_id: oldTransaction.user_id,
        trans_id: oldTransaction._id,
        balanceType: source,
        amount: parseFloat(newSourceBalanceAmount.toFixed(2)),
        date: new Date().toISOString(),
      });

      await newSourceBalance.save();

      // Update the old balance entry's balanceType
      oldBalance.balanceType = source;
      await oldBalance.save();
    }

    // Step 7: Update the transaction
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

    console.log('Updated transaction:', updatedTransaction);

    res.status(200).json({
      message: 'Transaction updated successfully',
      transaction: updatedTransaction,
      updatedBalance: oldBalance,
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
