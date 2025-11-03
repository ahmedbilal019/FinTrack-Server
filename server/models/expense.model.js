import mongoose from 'mongoose';

let expenseSchema = mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  exp_date: {
    type: String,
    required: true,
  },
  exp_value: {
    type: Number,
    default: 0,
    required: true,
  },
  exp_category: {
    type: String,
    enum: ['Eating', 'Transport', 'Utilities', 'Entertainment', 'Other'], 
    required: true,

  },
});

const expenseModel = mongoose.model('expense', expenseSchema);
export default expenseModel;
