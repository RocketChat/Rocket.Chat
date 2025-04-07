import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IRole } from './IRole';
import type { Serialized } from './Serialized';
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

export const isPersonalAccessToken = (token: LoginToken): token is IPersonalAccessToken =>
	'type' in token && token.type === 'personalAccessToken';

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

export interface IOAuthUserServices {
	google?: any;
	facebook?: any;
	github?: any;
	linkedin?: any;
	twitter?: any;
	gitlab?: any;
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

export interface IUserServices extends IOAuthUserServices {
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
}

type IUserService = keyof IUserServices;
type IOAuthService = keyof IOAuthUserServices;

const defaultOAuthKeys = [
	'google',
	'dolphin',
	'facebook',
	'github',
	'gitlab',
	'google',
	'ldap',
	'linkedin',
	'nextcloud',
	'saml',
	'twitter',
] as IOAuthService[];
const userServiceKeys = ['emailCode', 'email2fa', 'totp', 'resume', 'password', 'passwordHistory', 'cloud', 'email'] as IUserService[];

export const isUserServiceKey = (key: string): key is IUserService =>
	userServiceKeys.includes(key as IUserService) || defaultOAuthKeys.includes(key as IOAuthService);

export const isDefaultOAuthUser = (user: IUser): boolean =>
	!!user.services && Object.keys(user.services).some((key) => defaultOAuthKeys.includes(key as IOAuthService));

export const isCustomOAuthUser = (user: IUser): boolean =>
	!!user.services && Object.keys(user.services).some((key) => !isUserServiceKey(key));

export const isOAuthUser = (user: IUser): boolean => isDefaultOAuthUser(user) || isCustomOAuthUser(user);

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
	customFields?: Record<string, any>;
	settings?: IUserSettings;
	defaultRoom?: string;
	ldap?: boolean;
	extension?: string;
	freeSwitchExtension?: string;
	inviteToken?: string;
	canViewAllInfo?: boolean;
	phone?: string;
	reason?: string;
	// TODO: move this to a specific federation user type
	federated?: boolean;
	// @deprecated
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
	requirePasswordChange?: boolean;
	requirePasswordChangeReason?: string;
	roomRolePriorities?: Record<string, number>;
	isOAuthUser?: boolean; // client only field
	__rooms?: string[];
}

export interface IRegisterUser extends IUser {
	username: string;
	name: string;
}

export const isRegisterUser = (user: IUser): user is IRegisterUser => user.username !== undefined && user.name !== undefined;
export const isUserFederated = (user: Partial<IUser> | Partial<Serialized<IUser>>) => 'federated' in user && user.federated === true;

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

export type UserPresence = Readonly<
	Partial<Pick<IUser, 'name' | 'status' | 'utcOffset' | 'statusText' | 'avatarETag' | 'roles' | 'username'>> & Required<Pick<IUser, '_id'>>
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

export const getUserDisplayName = (name: IUser['name'], username: IUser['username'], useRealName: boolean): string | undefined =>
	useRealName ? name || username : username;
