import mongoose from "mongoose";

let balanceSchema = mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  amount: {
    type: Number,
    default: 0,
  },
  balanceType: {
    type: String,
    required: true,
    enum: ["bank", "wallet"],
  },
  date: {
    type: String,
    required: true,
  },
});

const balanceModel = mongoose.model("balance", balanceSchema);
export default balanceModel;
