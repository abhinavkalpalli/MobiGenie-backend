import { Response } from 'express';

export function setGuestAccessCookie(res: Response, accessToken: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = isProduction ? 'none' : 'strict';
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge: 24 * 60 * 60 * 1000,
  });
}
