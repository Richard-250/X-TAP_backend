import * as authService from "../service/auth/auth.service.js";
import { sendPasswordResetConfirmationEmail } from "../service/user/email.service.js";
import { verifyUserAccount } from "../service/user/user.service.js";
import { isValidEmail } from "../utils/validators.js";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";

const sendResponse = (
	res,
	status,
	success,
	message,
	data = null,
	error = null,
) => {
	const response = {
		success,
		message,
	};
	if (data) response.data = data;
	if (error && process.env.NODE_ENV === "development") response.error = error;
	return res.status(status).json(response);
};

export const login = asyncHandler(async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return sendResponse(res, 400, false, "Email and password are required");
	}
	const result = await authService.authenticateUser(email, password);
	return sendResponse(res, 200, true, "Login successful", {
		token: result.token,
		user: result.user,
	});
});

export const generateNfcToken = asyncHandler(async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return sendResponse(res, 400, false, "Email and password are required");
	}
	const result = await authService.generateNfcLoginToken(email, password);
	return sendResponse(
		res,
		200,
		true,
		"NFC login token generated successfully",
		{
			nfcToken: result.nfcToken,
			expiresAt: result.expiresAt,
			user: result.user,
		},
	);
});

export const loginWithNfcToken = asyncHandler(async (req, res) => {
	const { nfcToken } = req.body;
	if (!nfcToken) {
		return sendResponse(res, 400, false, "NFC token is required");
	}
	const result = await authService.authenticateWithNfcToken(nfcToken);
	return sendResponse(res, 200, true, "NFC login successful", {
		token: result.token,
		user: result.user,
	});
});


export const verifyAccount = asyncHandler(async (req, res) => {
	try {
		const { token } = req.params;
		const userPromise = authService.findUserByVerificationToken(token);
		const user = await userPromise;

		if (!user) {
			console.error("Invalid or expired verification token");
			return;
		}

		await verifyUserAccount(user);
		sendResponse(res, 202, true, "Verification successful");
	} catch (error) {
		sendResponse(res, 500, false, "Verification failed. Please try again later.");
	}
});




export const changePassword = asyncHandler(async (req, res) => {
	try {
	const { currentPassword, newPassword } = req.body;
	const userId = req.user.id;
	if (!currentPassword || !newPassword) {
		return sendResponse(
			res,
			400,
			false,
			"Current password and new password are required",
		);
	}
	if (newPassword.length !== 4 || !/^\d{4}$/.test(newPassword)) {
		return sendResponse(
			res,
			400,
			false,
			"New password must be exactly 4 digits",
		);
	}
	const user = await authService.findUserById(userId);
	if (!user) {
		return sendResponse(res, 404, false, "User not found");
	}
	const isPasswordValid = await authService.validateUserPassword(
		currentPassword,
		user.password,
	);
	if (!isPasswordValid) {
		return sendResponse(res, 401, false, "Current password is incorrect");
	}
	if (currentPassword === newPassword) {
		return sendResponse(
			res,
			400,
			false,
			"New password must be different from current password",
		);
	}
	const newPasswordWithPrefix = `WM${newPassword}`;
	await authService.updateUserPassword(user, newPasswordWithPrefix);

		await sendPasswordResetConfirmationEmail(user, newPasswordWithPrefix);
	} catch (emailErr) {
		console.error("Failed to send password email:", emailErr.message);
	}
	return sendResponse(res, 200, true, "Password changed successfully");
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
	try {
	  const { email } = req.body;
	  
	  if (!email) {
		return sendResponse(res, 400, false, "Email is required");
	  }
	  
	  const user = await authService.findUserByEmail(email);
	  
	  if (!user) {
		return sendResponse(res, 404, false, "No account found with this email");
	  }
	  
	  if (user.isVerified) {
		return sendResponse(res, 400, false, "Account is already verified");
	  }
	  
	  if (user.verificationExpires && user.verificationExpires > new Date()) {
		const timeLeft = Math.round(
		  (user.verificationExpires - new Date()) / (1000 * 60)
		);
		
		return sendResponse(
		  res,
		  400,
		  false,
		  `Verification token is still valid. Please check your email or try again in ${timeLeft} minutes.`
		);
	  }
	  
	  const { verificationExpires } = await authService.regenerateVerificationToken(user);
	  
	  return sendResponse(
		res,
		200,
		true,
		"New verification email sent successfully",
		{ expiresAt: verificationExpires }
	  );
	} catch (error) {
	  console.error("Error resending verification email:", error);
	  return sendResponse(
		res, 
		500, 
		false, 
		"Failed to resend verification email"
	  );
	}
  });

export const forgotPassword = asyncHandler(async (req, res) => {
	try {
	const { email } = req.body;
	if (!email) {
		return sendResponse(res, 400, false, "Please provide your email address");
	}
	
		await authService.processForgotPassword(email);
		return sendResponse(
			res,
			200,
			true,
			"If this email exists and is verified, a password reset link has been sent",
		);
	} catch (error) {
		if (error.statusCode === 403) {
			return sendResponse(res, 403, false, error.message);
		}
		return sendResponse(
			res,
			200,
			true,
			"If this email exists and is verified, a password reset link has been sent",
		);
	}
});

export const resetPassword = asyncHandler(async (req, res) => {
	try {
	  const { token, email: encodedEmail } = req.params;
	  
	  if (!token || !encodedEmail) {
		return sendResponse(res, 400, false, "Token and email are required");
	  }
	  
	  let email;
	  try {
		email = decodeURIComponent(encodedEmail);
	  } catch (decodeError) {
		return sendResponse(res, 400, false, "Invalid email encoding");
	  }
	  
	  if (!isValidEmail(email)) {
		return sendResponse(res, 400, false, "Invalid email format");
	  }
	  
	  const user = await authService.findUserByResetToken(token, email);
	  if (!user) {
		return sendResponse(
		  res,
		  400,
		  false,
		  "Invalid token, expired token, or email mismatch"
		);
	  }
	  
	  const { user: updatedUser } = await authService.resetUserPassword(user);
	  return sendResponse(
		res,
		200,
		true,
		"Password reset successful. Check your email for the new password.",
		{ user: updatedUser }
	  );
	} catch (error) {
	  console.error("Password reset error:", error);
	  return sendResponse(res, 500, false, "Failed to reset password");
	}
  });

  
export const passwordViewHandler = asyncHandler(async (req, res) => {
	const { token } = req.params;
	const JWT_SECRET = process.env.JWT_PASSWORD_SECRET;
	if (!JWT_SECRET) {
		return res.status(500).render("password-expired", {
			success: false,
			message: "Server configuration error.",
		});
	}
	try {
		const decodedToken = jwt.verify(token, JWT_SECRET);
		if (decodedToken.viewed) {
			return res.status(403).render("password-expired", {
				message: "This password link has already been viewed.",
			});
		}
		const { password, userId } = decodedToken;
		const updatedToken = jwt.sign(
			{ ...decodedToken, viewed: true },
			JWT_SECRET,
			{ expiresIn: "5m" },
		);
		res.cookie("password_viewed", updatedToken, {
			httpOnly: true,
			maxAge: 5 * 60 * 1000,
		});
		return res.render("view-password", {
			password,
			token,
			userId,
		});
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			return res.status(403).render("password-expired", {
				success: false,
				message: "This password link has expired.",
			});
		}
		return res.status(403).render("password-expired", {
			success: false,
			message: "Invalid password link.",
		});
	}
});
