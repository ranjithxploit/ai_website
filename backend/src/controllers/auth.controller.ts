import { Response, NextFunction } from 'express';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';
import { AuthRequest } from '../middleware/auth';
import { generateTokenPair, hashToken, getRefreshTokenExpiration } from '../utils/jwt';
import { logAuthEvent, logSecurityEvent } from '../utils/logger';
import { RegisterInput, LoginInput } from '../utils/validation';

/**
 * Register new user
 */
export const register = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name }: RegisterInput = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
      return;
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      role: 'student',
    });

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Save refresh token
    await RefreshToken.create({
      userId: user._id,
      token: hashToken(tokens.refreshToken),
      expiresAt: getRefreshTokenExpiration(),
    });

    logAuthEvent('USER_REGISTERED', user._id.toString(), {
      email: user.email,
      ip: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password }: LoginInput = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logSecurityEvent('LOGIN_FAILED_USER_NOT_FOUND', {
        email,
        ip: req.ip,
      });

      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logSecurityEvent('LOGIN_FAILED_WRONG_PASSWORD', {
        userId: user._id.toString(),
        email,
        ip: req.ip,
      });

      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Save refresh token
    await RefreshToken.create({
      userId: user._id,
      token: hashToken(tokens.refreshToken),
      expiresAt: getRefreshTokenExpiration(),
    });

    logAuthEvent('USER_LOGGED_IN', user._id.toString(), {
      email: user.email,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 */
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete refresh token
      await RefreshToken.deleteOne({ token: hashToken(refreshToken) });
    }

    logAuthEvent('USER_LOGGED_OUT', req.user?.userId || null, {
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
      return;
    }

    // Find refresh token
    const hashedToken = hashToken(refreshToken);
    const storedToken = await RefreshToken.findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() },
    });

    if (!storedToken) {
      logSecurityEvent('REFRESH_TOKEN_INVALID', {
        ip: req.ip,
      });

      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
      return;
    }

    // Get user
    const user = await User.findById(storedToken.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Generate new tokens
    const tokens = generateTokenPair(user);

    // Delete old refresh token and save new one
    await RefreshToken.deleteOne({ _id: storedToken._id });
    await RefreshToken.create({
      userId: user._id,
      token: hashToken(tokens.refreshToken),
      expiresAt: getRefreshTokenExpiration(),
    });

    logAuthEvent('TOKEN_REFRESHED', user._id.toString(), {
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  logout,
  refreshAccessToken,
  getCurrentUser,
};
