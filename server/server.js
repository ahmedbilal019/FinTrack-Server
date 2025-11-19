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
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? [
        'https://fin-track-teal-two.vercel.app', // Your Vercel domain
      ]
    : ['http://localhost:5173'];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use('/api/v1/', router);

app.listen(PORT, '0.0.0.0', (error) => {
  if (error) {
    throw error;
  }
  console.log('Express Server Started');
  console.log(`Environment : ${process.env.NODE_ENV}`);
});
