export interface JwtPayload {
  sub: string;
  email: string | null;
  role: string;
  tokenVersion: number;
  isGuest?: boolean;
  sessionCount?: number;
  messageCount?: number;
  iat?: number;
  exp?: number;
}
