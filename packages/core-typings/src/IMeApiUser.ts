import type { IUser, IUserCalendar } from './IUser';

/**
 * Public service fields exposed by getUserInfo (password hash is never leaked).
 */
export type IMeApiUserServices = {
	github?: Record<string, unknown>;
	gitlab?: Record<string, unknown>;
	email2fa?: { enabled: boolean; changedAt?: Date };
	totp?: { enabled: boolean };
	password: { exists: boolean };
	email?: { verificationTokens?: Array<{ token: string; address: string; when: Date }> };
	cloud?: { accessToken?: string; refreshToken?: string; expiresAt: Date };
	resume?: { loginTokens?: Array<Record<string, unknown>> };
	emailCode?: Array<{ code: string; expire: Date }>;
};

/**
 * User document fields projected by getBaseUserFields() plus full `services` (e.g. GET /api/v1/me),
 * after getUserInfo() reshapes `settings`, `services`, `email`, and adds `avatarUrl` / `isOAuthUser`.
 */
type MeProjectedUserFields = Pick<
	IUser,
	| 'name'
	| 'username'
	| 'nickname'
	| 'emails'
	| 'status'
	| 'statusDefault'
	| 'statusText'
	| 'statusConnection'
	| 'bio'
	| 'avatarOrigin'
	| 'utcOffset'
	| 'language'
	| 'roles'
	| 'active'
	| 'defaultRoom'
	| 'customFields'
	| 'requirePasswordChange'
	| 'requirePasswordChangeReason'
	| 'banners'
	| '_updatedAt'
	| 'avatarETag'
	| 'abacAttributes'
	| 'oauth'
	| 'createdAt'
	| 'lastLogin'
	| 'ldap'
>;

export type IMeApiUser = { _id: IUser['_id'] } & Partial<MeProjectedUserFields> & {
		avatarUrl: string;
		isOAuthUser: boolean;
		settings: {
			profile: Record<string, unknown>;
			preferences?: Record<string, unknown>;
			calendar: IUserCalendar;
		};
		email?: string;
		services?: IMeApiUserServices;
		/** Present when projected via getBaseUserFields (not on IUser). */
		enableAutoAway?: boolean;
		/** Present when projected via getBaseUserFields (not on IUser). */
		idleTimeLimit?: number;
		/** Present when projected via getBaseUserFields (not on IUser). */
		statusLivechat?: string;
		/** Present when projected via getBaseUserFields (not on IUser). */
		openBusinessHours?: string[];
	};
