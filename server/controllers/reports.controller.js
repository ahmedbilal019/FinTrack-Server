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
      .sort({ date: -1 })
      .limit(parseInt(maxLimit)); // Sort by date ascending

    // console.log(`Found ${balances} balance entries`);
    if (!balances || balances.length === 0) {
      return res.status(404).json({
        message: 'No balance data found for the specified period',
        success: false,
      });
    }
    // labels should be in MM-DD format
    const labels = balances.map((b) => {
      const transactionDate = new Date(b.date);
      // console.log('Transaction Date:', b.date);

      return `${transactionDate.toLocaleString('default', {
        month: 'short',
      })}-${transactionDate.getDate()}`;
    });
    labels.reverse();
    const data = balances.map((b) => b.amount);
    data.reverse();
    // aggregate same day values into one date only
    const aggregatedData = {};
    labels.forEach((label, index) => {
      if (!aggregatedData[label]) {
        aggregatedData[label] = 0;
      }
      aggregatedData[label] = data[index];
    });

    res.status(200).json({
      success: true,
      date: Object.keys(aggregatedData),
      balance: Object.values(aggregatedData),
      // labels: labels,
      // data: data,
    });
  } catch (error) {
    console.error('Error in getBalanceOverTime:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching balance over time',
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
