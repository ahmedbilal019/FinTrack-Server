import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendLoginElert = async (recieverEmail) => {
  try {
    const transporter = mailTransporter();
    const mailOptions = {
      from: process.env.GMAIL_EMAIL,
      to: recieverEmail,
      subject: "New Login Alert",
      text: `A new login to your account was detected.
       If this was not you, please secure your account immediately.`,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Login alert sent to ${recieverEmail}`);
  } catch (error) {
    console.error(`Error sending login alert to ${recieverEmail}:`, error);
  }
};

const mailTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_PASS,
    },
    
  });
};
