import incomeModel from "../models/income.model.js";

export const addIncome = async (req, res) => {
  try {
    let { user_id, date, value, source, location } = req.body;
    if (!user_id || !date || !value || !source || !location) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }
    const newIncome = new incomeModel({  
      user_id,
      date: new Date(date),
      value: parseFloat(value),
      source,
      location,
    });
    await newIncome.save();

    return res.status(201).json({
      message: "Income added successfully",
      success: true,
      data: newIncome,
    });
  } catch (error) {
    console.error("Error adding income:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const getIncomesByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const incomes = await incomeModel
      .find({ user_id })
      .sort({ date: -1 })
      .exec();
    if (!incomes || incomes.length === 0) {
      return res.status(404).json({
        message: "No incomes found for this user",
        success: false,
      });
    }
    return res.status(200).json({
      message: "Incomes retrieved successfully",
      success: true,
      data: incomes,
    });
  } catch (error) {
    console.error("Error retrieving incomes:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
