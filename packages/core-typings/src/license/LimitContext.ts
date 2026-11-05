import type { IUser } from '../IUser.js';
import type { LicenseLimitKind } from './ILicenseV3.js';

export type LimitContext<T extends LicenseLimitKind> = { extraCount?: number } & (T extends 'roomsPerGuest'
	? { userId: IUser['_id'] }
	: Record<string, never>);
