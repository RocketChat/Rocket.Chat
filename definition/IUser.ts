import { USER_STATUS } from './UserStatus';

export interface ILoginToken {
	hashedToken: string;
	twoFactorAuthorizedUntil?: Date;
	twoFactorAuthorizedHash?: string;
}

export interface IMeteorLoginToken extends ILoginToken {
	when: Date;
}

export interface IPersonalAccessToken extends ILoginToken {
	type: 'personalAccessToken';
	createdAt: Date;
	lastTokenPart: string;
	name?: string;
	bypassTwoFactor?: boolean;
}

export interface IUserEmailVerificationToken {
	token: string;
	address: string;
	when: Date;
}

export interface IUserEmailCode {
	code: string;
	expire: Date;
}

type LoginToken = IMeteorLoginToken & IPersonalAccessToken;
export type Username = string;

export interface IUserServices {
	password?: {
		bcrypt: string;
	};
	email?: {
		verificationTokens?: IUserEmailVerificationToken[];
	};
	resume?: {
		loginTokens?: LoginToken[];
	};
	google?: any;
	facebook?: any;
	github?: any;
	totp?: {
		enabled: boolean;
		hashedBackup: string[];
		secret: string;
	};
	email2fa?: {
		enabled: boolean;
		changedAt: Date;
	};
	emailCode: IUserEmailCode[];
	saml?: {
		inResponseTo?: string;
		provider?: string;
		idp?: string;
		idpSession?: string;
		nameID?: string;
	};
}

export interface IUserEmail {
	address: string;
	verified: boolean;
}

export interface IUserSettings {
	profile: any;
	preferences: {
		[key: string]: any;
	};
}

export interface IRole {
	description: string;
	mandatory2fa?: boolean;
	name: string;
	protected: boolean;
	scope?: string;
	_id: string;
}

export interface IUser {
	_id: string;
	createdAt: Date;
	roles: string[];
	type: string;
	active: boolean;
	username?: string;
	name?: string;
	services?: IUserServices;
	emails?: IUserEmail[];
	status?: USER_STATUS;
	statusConnection?: string;
	lastLogin?: Date;
	avatarOrigin?: string;
	avatarETag?: string;
	utcOffset?: number;
	language?: string;
	statusDefault?: USER_STATUS;
	statusText?: string;
	oauth?: {
		authorizedClients: string[];
	};
	_updatedAt?: Date;
	statusLivechat?: string;
	e2e?: {
		private_key: string;
		public_key: string;
	};
	requirePasswordChange?: boolean;
	customFields?: {
		[key: string]: any;
	};
	settings?: IUserSettings;
}

export type IUserDataEvent = {
	id: unknown;
}
& (
	({
		type: 'inserted';
	} & IUser)
	| ({
		type: 'removed';
	})
	| ({
		type: 'updated';
		diff: Partial<IUser>;
		unset: Record<keyof IUser, boolean | 0 | 1>;
	})
)
