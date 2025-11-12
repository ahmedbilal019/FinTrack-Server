import transactionModel from '../models/transactions.model.js';
import balanceModel from '../models/balance.model.js';

export const getBalanceOverTime = async (req, res) => {
  try {
    const { user_id, monthsNumber } = req.params;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(monthsNumber));

    console.log('Date range:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      monthsNumber: parseInt(monthsNumber),
    });

    // Get all balance entries for both wallet and bank within date range
    const balances = await balanceModel
      .find({
        user_id,
        date: { $gte: startDate.toISOString(), $lte: endDate.toISOString() },
      })
      .sort({ date: 1 }); // Sort by date ascending

    console.log(`Found ${balances.length} balance entries`);

    if (!balances || balances.length === 0) {
      return res.status(404).json({
        message: 'No balance data found for the specified period',
        success: false,
      });
    }

    // Generate weekly intervals
    const weeklyLabels = [];
    const current = new Date(startDate);

    // Start from the beginning of the week that contains startDate
    current.setDate(current.getDate() - current.getDay()); // Go to Sunday
    current.setHours(0, 0, 0, 0);

    while (current <= endDate) {
      const weekLabel = current.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      weeklyLabels.push({
        label: weekLabel,
        date: new Date(current),
        weekStart: new Date(current),
        weekEnd: new Date(current.getTime() + 6 * 24 * 60 * 60 * 1000), // Add 6 days
      });
      current.setDate(current.getDate() + 7); // Move to next week
    }

    console.log(`Generated ${weeklyLabels.length} weekly intervals`);
    console.log(
      'Weekly labels:',
      weeklyLabels.map((w) => w.label)
    );

    // For each week, find the latest balance for each account type up to that week's end
    const weeklyData = [];

    for (const week of weeklyLabels) {
      // Find the most recent balance for each account type up to this week's end
      const bankBalances = balances.filter(
        (b) => b.balanceType === 'bank' && new Date(b.date) <= week.weekEnd
      );

      const walletBalances = balances.filter(
        (b) => b.balanceType === 'wallet' && new Date(b.date) <= week.weekEnd
      );

      // Get the latest balance for each account type
      const latestBankBalance =
        bankBalances.length > 0
          ? bankBalances[bankBalances.length - 1].amount
          : 0;

      const latestWalletBalance =
        walletBalances.length > 0
          ? walletBalances[walletBalances.length - 1].amount
          : 0;

      const total = parseFloat(
        (latestBankBalance + latestWalletBalance).toFixed(2)
      );

      console.log(`Week ${week.label}:`, {
        bankBalancesFound: bankBalances.length,
        walletBalancesFound: walletBalances.length,
        latestBankBalance,
        latestWalletBalance,
        total,
      });

      weeklyData.push({
        label: week.label,
        bank: parseFloat(latestBankBalance.toFixed(2)),
        wallet: parseFloat(latestWalletBalance.toFixed(2)),
        total: total,
      });
    }

    console.log('All weekly data before filtering:', weeklyData);

    // Don't filter out weeks with zero balance - show progression
    // Instead, only filter if we have no balance data at all
    let filteredWeeklyData = weeklyData;

    // Only show weeks where we have some balance history
    const hasAnyBalanceData = weeklyData.some((week) => week.total > 0);

    if (hasAnyBalanceData) {
      // Find first week with balance data
      const firstWeekWithData = weeklyData.findIndex((week) => week.total > 0);
      // Show from first week with data onwards
      filteredWeeklyData = weeklyData.slice(firstWeekWithData);
    }

    // Extract labels and totals for chart
    const labels = filteredWeeklyData.map((week) => week.label);
    const totals = filteredWeeklyData.map((week) => week.total);

    console.log('Final weekly data generated:', {
      totalWeeks: filteredWeeklyData.length,
      labels,
      totals,
      balanceEntriesFound: balances.length,
    });

    res.status(200).json({
      labels,
      data: totals,
      weeklyBreakdown: filteredWeeklyData,
      message: 'Weekly balance data fetched successfully',
      success: true,
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
