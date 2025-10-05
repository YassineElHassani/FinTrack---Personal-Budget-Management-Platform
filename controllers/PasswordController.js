const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const { User } = require('../models');

const TOKEN_EXPIRE_MINUTES = parseInt(process.env.RESET_TOKEN_EXPIRE_MINUTES || '60', 10);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 2525,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendResetEmail(to, resetUrl) {
  const html = `
    <p>You requested a password reset for your FinTrack account.</p>
    <p>Click the link below to reset your password (expires in ${TOKEN_EXPIRE_MINUTES} minutes):</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <hr>
    <p>If you did not request this, ignore this email.</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'FinTrack — Password reset',
    html,
  });
}

exports.renderResetRequestForm = (req, res) => {
    res.render("reset-request", {
        title: "Reset Password",
        error: null,
        message: null
    });
}

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
        return res.render('reset-request', {
            title: "Reset Password",
            error: 'Email is required',
            message: null
        });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
        return res.render('reset-request', {
            title: "Reset Password",
            error: "This email is not registered.",
            message: null
        });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + TOKEN_EXPIRE_MINUTES * 60 * 1000);
    await user.save();

    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${token}`;
    await sendResetEmail(user.email, resetUrl);

    return res.render('reset-request', {
        title: "Reset Password",
        message: 'A reset link has been sent to your email address.',
        error: null
    });
  } catch (err) {
    console.error(err);
    return res.render('reset-request', {
        title: "Reset Password",
        error: 'An unexpected error occurred. Please try again later.',
        message: null
    });
  }
};

exports.renderResetForm = async (req, res) => {
  try {
    const token = req.params.token;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [require('sequelize').Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.render('reset-invalid', {
          title: "Invalid Link",
          message: 'This password reset link is invalid or has expired.'
        });
    }

    return res.render('reset-password', {
        title: "Set New Password",
        token,
        error: null
    });
  } catch (err) {
    console.error(err);
    return res.render('reset-invalid', {
        title: "Error",
        message: 'An unexpected error occurred.'
    });
  }
};

exports.resetPassword = async (req, res) => {
    const token = req.params.token;
  try {
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.render('reset-password', {
            title: "Set New Password",
            token,
            error: "Passwords do not match."
        });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [require('sequelize').Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.render('reset-invalid', {
          title: "Invalid Link",
          message: 'This password reset link is invalid or has expired.'
        });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    req.session.success = 'Your password has been successfully reset. Please log in.';
    return res.redirect('/login');

  } catch (err) {
    console.error(err);
    return res.render('reset-password', {
        title: "Set New Password",
        token,
        error: 'An unexpected error occurred. Please try again.'
    });
  }
};
