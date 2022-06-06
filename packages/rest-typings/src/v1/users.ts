import type { IExportOperation, ISubscription, ITeam, IUser } from '@rocket.chat/core-typings';
import Ajv from 'ajv';
import type { UserCreateParamsPOST } from './users/UserCreateParamsPOST';
import type { UserDeactivateIdleParamsPOST } from './users/UserDeactivateIdleParamsPOST';
import type { UserLogoutParamsPOST } from './users/UserLogoutParamsPOST';
import type { UserRegisterParamsPOST } from './users/UserRegisterParamsPOST';
import type { UsersAutocompleteParamsGET } from './users/UsersAutocompleteParamsGET';
import type { UserSetActiveStatusParamsPOST } from './users/UserSetActiveStatusParamsPOST';
import type { UsersInfoParamsGet } from './users/UsersInfoParamsGet';
import type { UsersListTeamsParamsGET } from './users/UsersListTeamsParamsGET';

export const ajv = new Ajv({
	coerceTypes: true,
});

type Users2faSendEmailCode = { emailOrUsername: string };

const Users2faSendEmailCodeSchema = {
	type: 'object',
	properties: {
		emailOrUsername: {
			type: 'string',
		},
	},
	required: ['emailOrUsername'],
	additionalProperties: false,
};

export const isUsers2faSendEmailCodeProps = ajv.compile<Users2faSendEmailCode>(Users2faSendEmailCodeSchema);

type UsersSetAvatar = { userId?: IUser['_id']; username?: IUser['username']; avatarUrl?: string };

const UsersSetAvatarSchema = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
			nullable: true,
		},
		username: {
			type: 'string',
			nullable: true,
		},
		avatarUrl: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isUsersSetAvatarProps = ajv.compile<UsersSetAvatar>(UsersSetAvatarSchema);

type UsersResetAvatar = { userId?: IUser['_id']; username?: IUser['username'] };

const UsersResetAvatarSchema = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
			nullable: true,
		},
		username: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isUsersResetAvatarProps = ajv.compile<UsersResetAvatar>(UsersResetAvatarSchema);

export type UsersEndpoints = {
	'users.2fa.enableEmail': {
		POST: () => void;
	};
	'users.2fa.disableEmail': {
		POST: () => void;
	};
	'users.2fa.sendEmailCode': {
		POST: (params: Users2faSendEmailCode) => void;
	};
	'users.autocomplete': {
		GET: (params: UsersAutocompleteParamsGET) => {
			items: Required<Pick<IUser, '_id' | 'name' | 'username' | 'nickname' | 'status' | 'avatarETag'>>[];
		};
	};

	'users.listTeams': {
		GET: (params: UsersListTeamsParamsGET) => { teams: ITeam[] };
	};

	'users.setAvatar': {
		POST: (params: UsersSetAvatar) => void;
	};
	'users.resetAvatar': {
		POST: (params: UsersResetAvatar) => void;
	};

	'users.requestDataDownload': {
		GET: (params: { fullExport?: 'true' | 'false' }) => {
			requested: boolean;
			exportOperation: IExportOperation;
		};
	};
	'users.logoutOtherClients': {
		POST: () => {
			token: string;
			tokenExpires: string;
		};
	};
	'users.removeOtherTokens': {
		POST: () => void;
	};
	'users.resetE2EKey': {
		POST: (
			params:
				| {
						userId: string;
				  }
				| {
						username: string;
				  }
				| {
						user: string;
				  },
		) => void;
	};
	'users.resetTOTP': {
		POST: (
			params:
				| {
						userId: string;
				  }
				| {
						username: string;
				  }
				| {
						user: string;
				  },
		) => void;
	};

	'users.presence': {
		GET: (params: { from: string; ids: string | string[] }) => {
			full: boolean;
			users: Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'utcOffset' | 'statusText' | 'avatarETag'>;
		};
	};

	'users.removePersonalAccessToken': {
		POST: (params: { tokenName: string }) => void;
	};

	'users.getPersonalAccessTokens': {
		GET: () => {
			tokens: {
				name?: string;
				createdAt: string;
				lastTokenPart: string;
				bypassTwoFactor: boolean;
			}[];
		};
	};
	'users.regeneratePersonalAccessToken': {
		POST: (params: { tokenName: string }) => {
			token: string;
		};
	};
	'users.generatePersonalAccessToken': {
		POST: (params: { tokenName: string; bypassTwoFactor: boolean }) => {
			token: string;
		};
	};
	'users.getUsernameSuggestion': {
		GET: () => {
			result: string;
		};
	};
	'users.forgotPassword': {
		POST: (params: { email: string }) => void;
	};
	'users.getPreferences': {
		GET: () => {
			preferences: Required<IUser>['settings']['preferences'];
		};
	};
	'users.createToken': {
		POST: () => {
			data: {
				userId: string;
				authToken: string;
			};
		};
	};

	// check(this.bodyParams, {
	// 	email: String,
	// 	name: String,
	// 	password: String,
	// 	username: String,
	// 	active: Match.Maybe(Boolean),
	// 	bio: Match.Maybe(String),
	// 	nickname: Match.Maybe(String),
	// 	statusText: Match.Maybe(String),
	// 	roles: Match.Maybe(Array),
	// 	joinDefaultChannels: Match.Maybe(Boolean),
	// 	requirePasswordChange: Match.Maybe(Boolean),
	// 	setRandomPassword: Match.Maybe(Boolean),
	// 	sendWelcomeEmail: Match.Maybe(Boolean),
	// 	verified: Match.Maybe(Boolean),
	// 	customFields: Match.Maybe(Object),
	// });

	'users.create': {
		POST: (params: UserCreateParamsPOST) => {
			user: IUser;
		};
	};

	'users.setActiveStatus': {
		POST: (params: UserSetActiveStatusParamsPOST) => {
			user: IUser;
		};
	};

	'users.deactivateIdle': {
		POST: (params: UserDeactivateIdleParamsPOST) => {
			count: number;
		};
	};

	'users.getPresence': {
		GET: (
			params:
				| {
						userId: string;
				  }
				| {
						username: string;
				  }
				| {
						user: string;
				  },
		) => {
			presence: 'online' | 'offline' | 'away' | 'busy';
			connectionStatus?: 'online' | 'offline' | 'away' | 'busy';
			lastLogin?: string;
		};
	};

	'users.info': {
		GET: (params: UsersInfoParamsGet) => {
			user: IUser & { rooms?: Pick<ISubscription, 'rid' | 'name' | 't' | 'roles' | 'unread'>[] };
		};
	};

	'users.register': {
		POST: (params: UserRegisterParamsPOST) => {
			user: Partial<IUser>;
		};
	};

	'users.logout': {
		POST: (params: UserLogoutParamsPOST) => {
			message: string;
		};
	};
};

export * from './users/UserCreateParamsPOST';
export * from './users/UserSetActiveStatusParamsPOST';
export * from './users/UserDeactivateIdleParamsPOST';
export * from './users/UsersInfoParamsGet';
export * from './users/UserRegisterParamsPOST';
export * from './users/UserLogoutParamsPOST';
export * from './users/UsersListTeamsParamsGET';
export * from './users/UsersAutocompleteParamsGET';
