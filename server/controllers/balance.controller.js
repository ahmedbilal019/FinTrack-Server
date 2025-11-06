import balanceModel from "../models/balance.model.js";

const getBalancesByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const balances = await balanceModel
      .find({ user_id }, { _id: 0 })
      .populate("user_id", "name email")
      .sort({ date: -1 });

    return res.status(200).json({
      message: "Balances fetched successfully",
      success: true,
      balances,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching balances",
      success: false,
      error: error.message,
    });
  }
};
const postBalance = async (req, res) => {
  try {
    let { user_id, amount, balanceType, date } = req.body;
    if (!user_id || !amount || !date || !balanceType) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }
    //
    //
    // Find the latest balance
    const lastBalance = await balanceModel
      .findOne({ user_id })
      .sort({ date: -1 });

    let newAmount = 0;

    if (!lastBalance) {
      // No previous balance — start from 0
      newAmount = type === "income" ? amount : -amount;
    } else {
      // Update existing balance
      newAmount =
        type === "income"
          ? lastBalance.amount + amount
          : lastBalance.amount - amount;
    }
    //
    //
    let newBalance = new balanceModel({
      user_id,
      amount,
      date,
    });
    await newBalance.save();
    return res.status(201).json({
      message: "Balance created successfully",
      success: true,
      balance: newBalance,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating balance",
      success: false,
      error: error.message,
    });
  }
};

export { getBalancesByUser, postBalance };
