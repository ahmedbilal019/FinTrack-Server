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
    console.log(balanceArray);

    return res.status(200).json({
      message: "Balances fetched successfully",
      success: true,
      bankBalance: bankBalance.amount,
      walletBalance: walletBalance.amount,
      balances: balanceArray,
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

export { getBalancesByUser };
