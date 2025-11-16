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
        console.log('Current Amount : ', currentAmount);
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
        console.log('Transaction Amount:', tx.amount);
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
    const deletedTransaction = await transactionModel.findByIdAndDelete(
      transaction_id
    );
    if (!deletedTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Find the balance entry for this specific transaction
    let precedingTransactions = await transactionModel
      .find({
        user_id,
        source: deletedTransaction.source,
        date: { $gte: deletedTransaction.date },
      })
      .sort({ date: -1 });
    console.log('Preceding Transactions:', precedingTransactions);
    let deleteBalance = await balanceModel.deleteMany({
      user_id,
      trans_id: deletedTransaction._id,
    });

    console.log('Deleted Balance: ', deleteBalance);
    if (precedingTransactions.length === 0) {
      return res.status(200).json({
        message: 'Transaction deleted successfully',
        transaction: deletedTransaction,
        updatedBalances: deleteBalance,
      });
    } else {
      // There are subsequent transactions, need to update their balances
      // First delete the existing balances for these transactions
      // Create new balance entries starting from the preceding balance
      let balanceAfterDate = await balanceModel.deleteMany({
        user_id,
        trans_id: { $in: precedingTransactions.map((tx) => tx._id) },
      });
      console.log('Deleted balances after date:', balanceAfterDate);

      // Create new balance entries starting from the preceding balance
      let precedingBalance = await balanceModel
        .findOne({
          user_id,
          balanceType: deletedTransaction.source,
        })
        .sort({ date: -1 });
      console.log('Preceding Balance: ', precedingBalance);

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
          balanceType: tx.source,
          amount: updatedAmount,
          date: tx.date,
        });
        await transactionBalance.save();

        console.log(
          'Updated balance for transaction:',
          updatedAmount,
          ' Transaction Amount:',
          tx.amount
        );
      }
      res.status(200).json({
        message: 'Transaction deleted successfully - balances updated',
        transaction: deletedTransaction,
        success: true,
      });
    }
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

    // Update the transaction first
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

    // Determine the earliest date that needs balance recalculation
    const earliestDate = new Date(
      Math.min(
        new Date(oldTransaction.date).getTime(),
        new Date(date).getTime()
      )
    ).toISOString();

    // Handle source changes - need to recalculate both old and new sources
    const sourcesToUpdate =
      source !== oldTransaction.source
        ? [oldTransaction.source, source]
        : [source];

    for (const balanceType of sourcesToUpdate) {
      // Find all transactions from the earliest affected date for this source
      const precedingTransactions = await transactionModel
        .find({
          user_id: oldTransaction.user_id,
          source: balanceType,
          date: { $gte: earliestDate },
        })
        .sort({ date: 1 }); // Sort ascending for chronological processing

      console.log(
        `Preceding Transactions for ${balanceType}:`,
        precedingTransactions.length
      );

      if (precedingTransactions.length > 0) {
        // Delete existing balance entries for these transactions
        const deleteResult = await balanceModel.deleteMany({
          user_id: oldTransaction.user_id,
          balanceType: balanceType,
          date: { $gte: earliestDate },
        });

        console.log(
          `Deleted ${deleteResult.deletedCount} balance entries for ${balanceType}`
        );

        // Get the preceding balance (before the earliest date)
        const precedingBalance = await balanceModel
          .findOne({
            user_id: oldTransaction.user_id,
            balanceType: balanceType,
            date: { $lt: earliestDate },
          })
          .sort({ date: -1 });

        console.log(`Preceding Balance for ${balanceType}:`, precedingBalance);

        let currentAmount = precedingBalance ? precedingBalance.amount : 0;

        // Recreate balance entries in chronological order
        for (const tx of precedingTransactions) {
          // Calculate new balance
          let updatedAmount =
            tx.type === 'income'
              ? currentAmount + tx.amount
              : currentAmount - tx.amount;
          currentAmount = updatedAmount;

          // Create new balance entry
          const transactionBalance = new balanceModel({
            user_id: oldTransaction.user_id,
            trans_id: tx._id,
            balanceType: balanceType,
            amount: parseFloat(updatedAmount.toFixed(2)),
            date: tx.date,
          });
          await transactionBalance.save();

          console.log(
            `Updated balance for transaction ${tx._id}:`,
            updatedAmount
          );
        }
      }
    }

    console.log('Updated transaction:', updatedTransaction);

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
