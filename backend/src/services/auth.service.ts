import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma';
import { generateAccessToken, generateRandomToken } from '../utils/tokens';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { Role } from '../utils/enums';

export class AuthService {
  private static SALT_ROUNDS = 12;

  public static async register(email: string, username: string, passwordPlain: string) {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw new ConflictError('A user with this email already exists');
      }
      throw new ConflictError('A user with this username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(passwordPlain, this.SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash,
        role: Role.USER,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      }
    });

    return user;
  }

  public static async login(emailOrUsername: string, passwordPlain: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername.toLowerCase() },
          { username: emailOrUsername.toLowerCase() },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate access & refresh tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      username: user.username,
    });
    const refreshTokenString = generateRandomToken();

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  public static async refresh(oldRefreshToken: string) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // If token is revoked, it's a security breach: someone is trying to reuse a token.
    // Revoke ALL tokens for this user for security.
    if (storedToken.revoked) {
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { revoked: true },
      });
      throw new UnauthorizedError('Compromised refresh token reused. All sessions revoked.');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Expired refresh token');
    }

    // Revoke the old token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Generate new access & refresh tokens
    const accessToken = generateAccessToken({
      userId: storedToken.userId,
      role: storedToken.user.role,
      email: storedToken.user.email,
      username: storedToken.user.username,
    });
    const newRefreshTokenString = generateRandomToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: newRefreshTokenString,
        userId: storedToken.userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshTokenString,
    };
  }

  public static async logout(refreshToken: string) {
    // Revoke token
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  }
}
