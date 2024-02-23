import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IRole } from './IRole';
import type { UserStatus } from './UserStatus';

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
	name: string;
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
	attempts: number;
}

type LoginToken = IMeteorLoginToken | IPersonalAccessToken;
export type Username = string;

export type ILoginUsername =
	| {
			username: string;
	  }
	| {
			email: string;
	  };
export type LoginUsername = string | ILoginUsername;

export interface IUserServices {
	password?: {
		exists?: boolean;
		bcrypt?: string;
	};
	passwordHistory?: string[];
	email?: {
		verificationTokens?: IUserEmailVerificationToken[];
	};
	resume?: {
		loginTokens?: LoginToken[];
	};
	cloud?: {
		accessToken: string;
		refreshToken: string;
		expiresAt: Date;
	};
	google?: any;
	facebook?: any;
	github?: any;
	linkedin?: any;
	twitter?: any;
	gitlab?: any;
	totp?: {
		enabled: boolean;
		hashedBackup: string[];
		secret: string;
		tempSecret?: string;
	};
	email2fa?: {
		enabled: boolean;
		changedAt: Date;
	};
	emailCode?: IUserEmailCode;
	saml?: {
		inResponseTo?: string;
		provider?: string;
		idp?: string;
		idpSession?: string;
		nameID?: string;
	};
	ldap?: {
		id: string;
		idAttribute?: string;
	};
	nextcloud?: {
		accessToken: string;
		refreshToken: string;
		serverURL: string;
	};
	dolphin?: {
		NickName?: string;
	};
}

export interface IUserEmail {
	address: string;
	verified?: boolean;
}

export interface IUserSettings {
	profile?: any;
	preferences?: {
		[key: string]: any;
	};
}

export interface IGetRoomRoles {
	_id: string;
	rid: string;
	u: {
		_id: string;
		username: string;
	};
	roles: string[];
}

export interface IUser extends IRocketChatRecord {
	_id: string;
	createdAt: Date;
	roles: IRole['_id'][];
	type: string;
	active: boolean;
	username?: string;
	nickname?: string;
	name?: string;
	services?: IUserServices;
	emails?: IUserEmail[];
	status?: UserStatus;
	statusConnection?: string;
	lastLogin?: Date;
	bio?: string;
	avatarOrigin?: string;
	avatarETag?: string;
	avatarUrl?: string;
	utcOffset?: number;
	language?: string;
	statusDefault?: UserStatus;
	statusText?: string;
	oauth?: {
		authorizedClients: string[];
	};
	_updatedAt: Date;
	e2e?: {
		private_key: string;
		public_key: string;
	};
	requirePasswordChange?: boolean;
	customFields?: {
		[key: string]: any;
	};
	settings?: IUserSettings;
	defaultRoom?: string;
	ldap?: boolean;
	extension?: string;
	inviteToken?: string;
	canViewAllInfo?: boolean;
	phone?: string;
	reason?: string;
	// TODO: move this to a specific federation user type
	federated?: boolean;
	federation?: {
		avatarUrl?: string;
		searchedServerNames?: string[];
	};
	banners?: {
		[key: string]: {
			id: string;
			priority: number;
			title: string;
			text: string;
			textArguments?: string[];
			modifiers: ('large' | 'danger')[];
			link: string;
			read?: boolean;
		};
	};
	importIds?: string[];
	_pendingAvatarUrl?: string;
}

export interface IRegisterUser extends IUser {
	username: string;
	name: string;
}

export const isRegisterUser = (user: IUser): user is IRegisterUser => user.username !== undefined && user.name !== undefined;
export const isUserFederated = (user: Partial<IUser>) => 'federated' in user && user.federated === true;

export type IUserDataEvent = {
	id: unknown;
} & (
	| {
			type: 'inserted';
			data: IUser;
	  }
	| {
			type: 'removed';
	  }
	| {
			type: 'updated';
			diff: Partial<IUser>;
			unset: Record<string, number>;
	  }
);

export type IUserInRole = Pick<
	IUser,
	'_id' | 'name' | 'username' | 'emails' | 'avatarETag' | 'createdAt' | 'roles' | 'type' | 'active' | '_updatedAt'
>;

export type AvatarUrlObj = {
	avatarUrl: string;
};

export type AvatarReset = 'reset';

export type AvatarServiceObject = {
	blob: Blob;
	contentType: string;
	service: string;
	url: string;
};

export type AvatarObject = AvatarReset | AvatarUrlObj | FormData | AvatarServiceObject;
