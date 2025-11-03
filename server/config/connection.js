import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const ConnectDb = async () => {
  try {
    const connect = await mongoose.connect(process.env.URI);
    console.log('DB Connected: ', connect.connection.name);
  } catch (error) {
    console.log('Error Connecting to DB : ', error.message);
    process.exit(1);
  }
};

export default ConnectDb;
