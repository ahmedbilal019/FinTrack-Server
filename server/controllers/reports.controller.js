import transactionModel from "../models/transactions.model.js";
import balanceModel from "../models/balance.model.js";
import mongoose from "mongoose";

export const getTransactionReport = async (req, res) => {
  try {
    const { user_id, monthsNumber } = req.params;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(monthsNumber));
    const endDate = new Date();
    const incomeTransactions = await transactionModel.find({
      user_id,
      type: "income",
      date: { $gte: startDate.toISOString(), $lte: endDate.toISOString() },
    });
    // each month transactions should be summed up
    // group by month
    const incomeReport = incomeTransactions.reduce((acc, transaction) => {
      const monthName = transaction.date.toLocaleString("default", {
        month: "short",
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
      type: "expense",
      date: { $gte: startDate, $lte: endDate },
    });
    // each month transactions should be summed up
    // group by month
    const expenseReport = expenseTransactions.reduce((acc, transaction) => {
      const monthName = transaction.date.toLocaleString("default", {
        month: "short",
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
    res.status(500).json({ message: "Error fetching transactions", error });
  }
};

// Fetch balances grouped by month (summed up format)
export const getBalanceReportByMonth = async (req, res) => {
  try {
    const { user_id, monthsNumber } = req.params;
    const months = parseInt(monthsNumber) || 6;

    const balanceReport = await balanceModel.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(user_id) } },
      {
        $project: {
          amount: 1,
          date: { $toDate: "$date" },
          year: { $year: { $toDate: "$date" } },
          month: { $month: { $toDate: "$date" } },
          monthName: {
            $dateToString: { format: "%b", date: { $toDate: "$date" } },
          },
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month", monthName: "$monthName" },
          totalBalance: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    // Create object with all months including missing ones
    const monthlyBalances = {};
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Fill last 'months' number of months
    const now = new Date();
    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthNames[date.getMonth()];
      monthlyBalances[monthName] = 0; // Default to 0
    }

    // Override with actual data
    balanceReport.forEach((entry) => {
      monthlyBalances[entry._id.monthName] = entry.totalBalance;
    });

    res.status(200).json({
      message: "Monthly balance report fetched successfully",
      success: true,
      balanceReport: monthlyBalances,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching balance report",
      success: false,
      error: error.message,
    });
  }
};

// export const currentMonthTransactionSummary = async (req, res) => {
//   try {
//     const { user_id } = req.params; // Get current month and year
//     const now = new Date();
//     const currentMonth = now.getMonth();
//     const currentYear = now.getFullYear();
//     const startDate = new Date(currentYear, currentMonth, 1); // First day of month
//     const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999); // Last day of month
//     // Fetch transactions for the current month
//     console.log('Current Month: ', currentMonth, currentYear);
//     console.log('Current Year: ', currentYear);
//     const transactions = await transactionModel.find({
//       user_id,
//       date: {
//         $gte: startDate.toISOString(),
//         $lte: endDate.toISOString(),
//       },
//     });

//     // Calculate summary
//     const summary = transactions.reduce(
//       (acc, transaction) => {
//         if (transaction.type === 'income') {
//           acc.totalIncome += transaction.amount;
//         } else {
//           acc.totalExpenses += transaction.amount;
//         }
//         return acc;
//       },
//       { totalIncome: 0, totalExpenses: 0 }
//     );

//     console.log('Current Month Summary: ', summary);
//     res.status(200).json({
//       summary,
//       success: true,
//       message: 'Current month transaction summary fetched successfully',
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: 'Error fetching current month transaction summary',
//       error,
//     });
//   }
// };
