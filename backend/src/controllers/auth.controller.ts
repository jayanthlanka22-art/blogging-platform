import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterSchema, LoginSchema } from '../utils/validation';
import { ValidationError, BadRequestError } from '../utils/errors';

const COOKIE_NAME = 'refreshToken';

const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth', // Restrict cookie path to auth endpoints
  });
};

export class AuthController {
  public static register = async (req: Request, res: Response) => {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.format());
    }

    const { email, username, password } = parseResult.data;
    const user = await AuthService.register(email, username, password);

    res.status(201).json({
      success: true,
      data: user,
      error: null,
      meta: null,
    });
  };

  public static login = async (req: Request, res: Response) => {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.format());
    }

    const { emailOrUsername, password } = parseResult.data;
    const { user, accessToken, refreshToken } = await AuthService.login(emailOrUsername, password);

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user,
        accessToken,
      },
      error: null,
      meta: null,
    });
  };

  public static refresh = async (req: Request, res: Response) => {
    const oldRefreshToken = req.cookies[COOKIE_NAME];
    if (!oldRefreshToken) {
      throw new BadRequestError('Refresh token cookie is missing');
    }

    const { accessToken, refreshToken } = await AuthService.refresh(oldRefreshToken);

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
      },
      error: null,
      meta: null,
    });
  };

  public static logout = async (req: Request, res: Response) => {
    const refreshToken = req.cookies[COOKIE_NAME];
    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
    });

    res.status(204).send();
  };
}
