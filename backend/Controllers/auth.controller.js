import User from "../Model/User.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import transporter from "../Config/nodeMailer.config.js";
import {
  EMAIL_VERIFY_TEMPLATE,
  PASSWORD_RESET_TEMPLATE,
} from "../Config/emailTemplate.config.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: "Missing details" });
  }
  try {
    const alreadyRegistered = await User.findOne({ email });

    if (alreadyRegistered) {
      return res.json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "Production",
      sameSite: process.env.NODE_ENV === "Production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // sending welcome email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcome to our website",
      text: `Welcome to our website. Your account has been created with email account : ${email}`,
    };
    await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message: "User Registered",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({
      success: false,
      message: "Email and Password are required",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "User not registered with this email",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Incorrect Password" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "User Logged In",
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });
    return res.json({ success: true, message: "User Logged Out" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// send verification OTP to the user's email
export const sendVerifyOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "Account doesn't exists" });
    }

    if (user.isAccountVerified) {
      return res.json({ success: false, message: "Account already verified" });
    }

    const OTP = String(Math.floor(100000 + Math.random() * 900000));

    user.verifyOtp = OTP;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    // sending otp to mail
    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account Verification OTP",
      // text: `Your OTP is ${OTP}. Verify your account using this OTP.`,
      html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", OTP).replace(
        "{{email}}",
        user.email
      ),
    };
    await transporter.sendMail(mailOption);
    res.json({ success: true, message: "Verification OTP sent to your email" });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyEmail = async (req, res) => {
  const { userId, OTP } = req.body;

  if (!userId || !OTP) {
    return res.json({ success: false, message: "Missing Details" });
  }
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.json({
        success: false,
        message: "Account doesn't exists",
      });
    }

    if (user.verifyOtp !== OTP || user.verifyOtp === "") {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    if (user.verifyOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP already expired" });
    }
    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;
    await user.save();
    return res.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const isAuthenticated = async (req, res) => {
  try {
    res.json({ success: true, message: "Authenticated Account" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// send password reset otp
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.json({ success: false, message: "Email is required" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found!" });
    }

    const OTP = String(Math.floor(100000 + Math.random() * 900000));

    user.resetOtp = OTP;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;
    await user.save();

    // sending otp to mail
    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Password Reset OTP",
      // text: `Your OTP is ${OTP} valid for 15 minutes. Reset your password using this OTP.`,
      html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", OTP).replace(
        "{{email}}",
        user.email
      ),
    };
    await transporter.sendMail(mailOption);
    return res.json({
      success: true,
      message: "Password reset OTP sent to your email",
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// reset user password
export const resetPassword = async (req, res) => {
  const { email, OTP, newPassword } = req.body;
  if (!email || !OTP || !newPassword) {
    return res.json({
      success: false,
      message: "Email, OTP and new Password is required!",
    });
  }
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "User doesn't exists",
      });
    }
    if (user.resetOtp === "" || user.resetOtp !== OTP) {
      return res.json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (user.resetOtpExpireAt < Date.now()) {
      return res.json({
        success: false,
        message: "OTP expired",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;
    await user.save();
    return res.json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
