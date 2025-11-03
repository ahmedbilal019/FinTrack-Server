import express, { Router } from 'express';
import ConnectDB from './config/connection.js';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import router from './routes/routes.js';
dotenv.config();
ConnectDB();

const PORT = process.env.PORT || 5002;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.send('Express App Started');
});
app.use(
  cors({
    origin: 'http://localhost:5173', // React dev server
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'], 
    credentials: true,
  })
);

app.use('/api/v1/', router);

app.listen(PORT, (error) => {
  if (error) {
    throw error;
  }
  console.log('Express Server Started');
});
