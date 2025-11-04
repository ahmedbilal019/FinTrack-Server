import mongoose from 'mongoose';

let transactionSchema = mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Income', 'Expense'],
  },
  category: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function (value) {
        if (this.type === 'Income') {
          const incomeCategories = ['Salary', 'Business', 'Investment'];
          return incomeCategories.includes(value);
        } else if (this.type === 'Expense') {
          const expenseCategories = [
            'Eating',
            'Shopping',
            'Entertainment',
            'Travel',
            'Groceries',
            'Rent',
            'Health',
            'Gift',
            'Fuel',
            'Transport',
            'Other',
          ];
          return expenseCategories.includes(value);
        }
      },
      message: 'Invalid category for the given transaction type.',
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
    enum: ['Bank', 'Wallet'],
  },
});

const transactionModel = mongoose.model('transaction', transactionSchema);
export default transactionModel;
