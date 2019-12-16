export interface ILoginToken {
	hashedToken: string;
	when: Date;
}

export interface IPersonalAccessToken {
	hashedToken: string;
	type: 'personalAccessToken';
	createdAt: Date;
	lastTokenPart: string;
	name?: string;
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

type LoginToken = ILoginToken | IPersonalAccessToken;

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
	status?: string;
	statusConnection?: string;
	lastLogin?: Date;
	avatarOrigin?: string;
	utcOffset?: number;
	language?: string;
	statusDefault?: string;
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
