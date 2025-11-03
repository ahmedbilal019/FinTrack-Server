import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const AuthenticateUser = async (req, res, next) => {
  try {
    req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ');
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        message: 'No token provided, authorization denied',
        success: false,
      });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          message: 'Token is not valid',
          success: false,
        });
      }
      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error authenticating user',
      success: false,
      error: error.message,
    });
  }
};
