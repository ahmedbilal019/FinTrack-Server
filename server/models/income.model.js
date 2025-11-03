import mongoose from 'mongoose';

let incomeSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
    },
    date: {
      type: Date,
      required: true,
    },
    value: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
    source: {
      type: String,
      required: true,
      enum: ['Salary', 'Business', 'Investment'],
    },
    location: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const incomeModel = mongoose.model('income', incomeSchema);
export default incomeModel;
