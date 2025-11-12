import balanceModel from "../models/balance.model.js";

const getBalancesByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const balances = await balanceModel
      .find({ user_id }, { _id: 0 })
      .populate("user_id", "name email")
      .sort({ date: -1 });
    // ------------- getting balance of bank and wollet seprately ------------------//
    const bankBalance = balances.find((b) => b.balanceType === "bank") || {
      amount: 0,
    };

    const walletBalance = balances.find((b) => b.balanceType === "wallet") || {
      amount: 0,
    };
    let balanceArray = {};
    balanceArray.bank = bankBalance.amount;
    balanceArray.wallet = walletBalance.amount;
    balanceArray.date = balances.date;
    const rawDate =
      bankBalance?.date ||
      walletBalance?.date ||
      (balances[0] && balances[0].date);
    balanceArray.date = rawDate ? new Date(rawDate).toISOString() : null;
    // console.log(balanceArray);

    res.status(200).json({
      message: "Balances fetched successfully",
      success: true,
      bankBalance: bankBalance.amount,
      walletBalance: walletBalance.amount,
      balances: balanceArray,
      date: balanceArray.date,
    });
    // -------------------------------//
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching balances",
      success: false,
      error: error.message,
    });
  }
};
// Save monthly balance summary (call this at end of each month or manually)
const saveMonthlyBalanceSummary = async (req, res) => {
  try {
    const { user_id } = req.params;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // Get all balances for current month
    const monthStart = new Date(year, now.getMonth(), 1);
    const monthEnd = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyBalances = await balanceModel.find({
      user_id,
      date: { $gte: monthStart, $lte: monthEnd },
    });

    // Sum up bank and wallet balances
    const bankTotal = monthlyBalances
      .filter((b) => b.balanceType === "bank")
      .reduce((sum, b) => sum + b.amount, 0);

    const walletTotal = monthlyBalances
      .filter((b) => b.balanceType === "wallet")
      .reduce((sum, b) => sum + b.amount, 0);

    // Save monthly summary
    const monthlyData = {
      user_id,
      amount: bankTotal + walletTotal, // Total balance
      bankBalance: bankTotal,
      walletBalance: walletTotal,
      month: month,
      year: year,
      date: monthEnd, // Save as end of month
      balanceType: "monthly_summary",
    };

    await balanceModel.create(monthlyData);

    res.status(200).json({
      message: "Monthly balance summary saved",
      success: true,
      data: monthlyData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error saving monthly balance summary",
      success: false,
      error: error.message,
    });
  }
};

export { getBalancesByUser, saveMonthlyBalanceSummary };
// export { getBalancesByUser };
