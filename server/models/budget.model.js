import mongoose from 'mongoose';

let budgetSchema = mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  budget_date: {
    type: String,
    required: true,
  },
  budget_amount: {
    type: Number,
    default: 0,
  },
});

const budgetModel = mongoose.model('budget', budgetSchema);
export default budgetModel;
