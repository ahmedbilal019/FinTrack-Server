import mongoose from "mongoose";

let transactionSchema = mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["income", "expense"],
  },
  category: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function (value) {
        if (this.type === "income") {
          const incomeCategories = ["salary", "business", "investment"];
          return incomeCategories.includes(value);
        } else if (this.type === "expense") {
          const expenseCategories = [
            "eating",
            "shopping",
            "entertainment",
            "travel",
            "groceries",
            "rent",
            "health",
            "gift",
            "fuel",
            "transport",
            "other",
          ];
          return expenseCategories.includes(value);
        }
      },
      message: "Invalid category for the given transaction type.",
    },
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    required: true,
  },
  source: {
    type: String,
    required: true,
    enum: ["bank", "wallet"],
  },
});

const transactionModel = mongoose.model("transaction", transactionSchema);
export default transactionModel;
