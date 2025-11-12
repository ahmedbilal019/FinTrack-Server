import transactionModel from '../models/transactions.model.js';
import balanceModel from '../models/balance.model.js';

export const getBankBalanceOverTime = async (req, res) => {
  try {
    const { user_id, maxLimit } = req.params;

    // Get all balance entries for both wallet and bank within date range
    const balances = await balanceModel
      .find({
        user_id,
        balanceType: 'bank',
      })
      .sort({ date: 1 })
      .limit(parseInt(maxLimit)); // Sort by date ascending

    console.log(`Found ${balances} balance entries`);

    if (!balances || balances.length === 0) {
      return res.status(404).json({
        message: 'No balance data found for the specified period',
        success: false,
      });
    }

  } catch (error) {
    console.error('Error in getBalanceOverTime:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching balance over time',
      error: error.message,
    });
  }
};

// Debug function to see balance data
export const getBalanceDebug = async (req, res) => {
  try {
    const { user_id, monthsNumber } = req.params;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(monthsNumber));

    // Get all balance entries
    const balances = await balanceModel.find({ user_id }).sort({ date: 1 });

    // Get balances within date range
    const balancesInRange = balances.filter((b) => {
      const balanceDate = new Date(b.date);
      return balanceDate >= startDate && balanceDate <= endDate;
    });

    res.status(200).json({
      totalBalanceEntries: balances.length,
      balanceEntriesInRange: balancesInRange.length,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      allBalances: balances.map((b) => ({
        date: b.date,
        amount: b.amount,
        balanceType: b.balanceType,
        trans_id: b.trans_id,
      })),
      balancesInRange: balancesInRange.map((b) => ({
        date: b.date,
        amount: b.amount,
        balanceType: b.balanceType,
        trans_id: b.trans_id,
      })),
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error getting balance debug info',
      error: error.message,
    });
  }
};

export const getTransactionReport = async (req, res) => {
  try {
    const { user_id, monthsNumber } = req.params;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(monthsNumber));
    const endDate = new Date();
    const incomeTransactions = await transactionModel.find({
      user_id,
      type: 'income',
      date: { $gte: startDate.toISOString(), $lte: endDate.toISOString() },
    });
    // each month transactions should be summed up
    // group by month
    const incomeReport = incomeTransactions.reduce((acc, transaction) => {
      const monthName = transaction.date.toLocaleString('default', {
        month: 'short',
      });
      if (!acc[monthName]) {
        acc[monthName] = { total: 0, count: 0 };
      }
      acc[monthName].total += transaction.amount;
      acc[monthName].count += 1;

      return acc;
    }, {});
    // console.log('Monthly Transactions Group: ', incomeReport);

    const expenseTransactions = await transactionModel.find({
      user_id,
      type: 'expense',
      date: { $gte: startDate, $lte: endDate },
    });
    // each month transactions should be summed up
    // group by month
    const expenseReport = expenseTransactions.reduce((acc, transaction) => {
      const monthName = transaction.date.toLocaleString('default', {
        month: 'short',
      });
      if (!acc[monthName]) {
        acc[monthName] = { total: 0, count: 0 };
      }
      acc[monthName].total += transaction.amount;
      acc[monthName].count += 1;

      return acc;
    }, {});

    // console.log('Monthly Expense Group: ', expenseReport);
    res.status(200).json({ incomeReport, expenseReport });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error });
  }
};
