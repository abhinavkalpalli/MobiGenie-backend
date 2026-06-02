export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: string;
  iat?: number; // Issued at timestamp
  exp?: number; // Expiration timestamp
}
