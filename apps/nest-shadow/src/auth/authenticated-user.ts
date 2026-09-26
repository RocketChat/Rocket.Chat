import type { IUser } from '@rocket.chat/core-typings';
import type { Request } from 'express';

export type AuthenticatedUser = IUser & { username: string };

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
