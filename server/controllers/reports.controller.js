import transactionModel from '../models/transactions.model.js';

export const getTransactionByMonth = async (req, res) => {
  try {
    const { user_id, monthsNumber } = req.params;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsNumber);
    const endDate = new Date();
    const incomeTransactions = await transactionModel.find({
      user_id,
      type: 'income',
      date: { $gte: startDate, $lte: endDate },
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
    console.log('Monthly Transactions Group: ', incomeReport);

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
    console.log('Monthly Expense Group: ', expenseReport);
    res.status(200).json({ incomeReport, expenseReport });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error });
  }
};
