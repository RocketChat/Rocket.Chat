import type { IExportOperation, ISubscription, ITeam, IUser, IPersonalAccessToken, UserStatus } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';
import type { UserCreateParamsPOST } from './users/UserCreateParamsPOST';
import type { UserDeactivateIdleParamsPOST } from './users/UserDeactivateIdleParamsPOST';
import type { UserLogoutParamsPOST } from './users/UserLogoutParamsPOST';
import type { UserRegisterParamsPOST } from './users/UserRegisterParamsPOST';
import type { UserSetActiveStatusParamsPOST } from './users/UserSetActiveStatusParamsPOST';
import type { UsersAutocompleteParamsGET } from './users/UsersAutocompleteParamsGET';
import type { UsersInfoParamsGet } from './users/UsersInfoParamsGet';
import type { UsersListStatusParamsGET } from './users/UsersListStatusParamsGET';
import type { UsersListTeamsParamsGET } from './users/UsersListTeamsParamsGET';
import type { UsersSendConfirmationEmailParamsPOST } from './users/UsersSendConfirmationEmailParamsPOST';
import type { UsersSendWelcomeEmailParamsPOST } from './users/UsersSendWelcomeEmailParamsPOST';
import type { UsersSetPreferencesParamsPOST } from './users/UsersSetPreferenceParamsPOST';
import type { UsersUpdateOwnBasicInfoParamsPOST } from './users/UsersUpdateOwnBasicInfoParamsPOST';
import type { UsersUpdateParamsPOST } from './users/UsersUpdateParamsPOST';

const ajv = new Ajv({
	coerceTypes: true,
});

type UsersInfo = { userId?: IUser['_id']; username?: IUser['username'] };

const UsersInfoSchema = {
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

export const isUsersInfoProps = ajv.compile<UsersInfo>(UsersInfoSchema);

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

type UsersPresencePayload = {
	users: UserPresence[];
	full: boolean;
};

export type UserPresence = Readonly<
	Partial<Pick<IUser, 'name' | 'status' | 'utcOffset' | 'statusText' | 'avatarETag' | 'roles' | 'username'>> & Required<Pick<IUser, '_id'>>
>;

export type UserPersonalTokens = Pick<IPersonalAccessToken, 'name' | 'lastTokenPart' | 'bypassTwoFactor'> & { createdAt: string };

export type DefaultUserInfo = Pick<
	IUser,
	| '_id'
	| 'username'
	| 'name'
	| 'status'
	| 'roles'
	| 'emails'
	| 'active'
	| 'avatarETag'
	| 'lastLogin'
	| 'type'
	| 'federated'
	| 'freeSwitchExtension'
>;

export type UsersEndpoints = {
	'/v1/users.2fa.enableEmail': {
		POST: () => void;
	};

	'/v1/users.2fa.disableEmail': {
		POST: () => void;
	};

	'/v1/users.2fa.sendEmailCode': {
		POST: (params: Users2faSendEmailCode) => void;
	};

	'/v1/users.sendConfirmationEmail': {
		POST: (params: UsersSendConfirmationEmailParamsPOST) => void;
	};

	'/v1/users.listTeams': {
		GET: (params: UsersListTeamsParamsGET) => { teams: ITeam[] };
	};

	'/v1/users.autocomplete': {
		GET: (params: UsersAutocompleteParamsGET) => {
			items: Required<Pick<IUser, '_id' | 'name' | 'username' | 'nickname' | 'status' | 'avatarETag'>>[];
		};
	};

	'/v1/users.list': {
		GET: (params: PaginatedRequest<{ fields: string }>) => PaginatedResult<{
			users: DefaultUserInfo[];
		}>;
	};

	'/v1/users.listByStatus': {
		GET: (params: UsersListStatusParamsGET) => PaginatedResult<{
			users: DefaultUserInfo[];
		}>;
	};

	'/v1/users.sendWelcomeEmail': {
		POST: (params: UsersSendWelcomeEmailParamsPOST) => void;
	};

	'/v1/users.setAvatar': {
		POST: (params: UsersSetAvatar) => void;
	};

	'/v1/users.resetAvatar': {
		POST: (params: UsersResetAvatar) => void;
	};

	'/v1/users.requestDataDownload': {
		GET: (params: { fullExport?: 'true' | 'false' }) => {
			requested: boolean;
			exportOperation: IExportOperation;
		};
	};

	'/v1/users.logoutOtherClients': {
		POST: () => {
			token: string;
			tokenExpires: string;
		};
	};

	'/v1/users.removeOtherTokens': {
		POST: () => void;
	};

	'/v1/users.resetE2EKey': {
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

	'/v1/users.resetTOTP': {
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

	'/v1/users.presence': {
		GET: (params: { from?: string; ids: string | string[] }) => UsersPresencePayload;
	};

	'/v1/users.removePersonalAccessToken': {
		POST: (params: { tokenName: string }) => void;
	};

	'/v1/users.getPersonalAccessTokens': {
		GET: () => {
			tokens: UserPersonalTokens[];
		};
	};

	'/v1/users.regeneratePersonalAccessToken': {
		POST: (params: { tokenName: string }) => {
			token: string;
		};
	};

	'/v1/users.generatePersonalAccessToken': {
		POST: (params: { tokenName: string; bypassTwoFactor: boolean }) => {
			token: string;
		};
	};

	'/v1/users.getUsernameSuggestion': {
		GET: () => {
			result: string;
		};
	};

	'/v1/users.getAvatarSuggestion': {
		GET: () => {
			suggestions: Record<
				string,
				{
					blob: string;
					contentType: string;
					service: string;
					url: string;
				}
			>;
		};
	};

	'/v1/users.checkUsernameAvailability': {
		GET: (params: { username: string }) => {
			result: boolean;
		};
	};

	'/v1/users.forgotPassword': {
		POST: (params: { email: string }) => void;
	};

	'/v1/users.getPreferences': {
		GET: () => {
			preferences: Required<IUser>['settings']['preferences'];
		};
	};

	'/v1/users.createToken': {
		POST: (params: { userId?: string; username?: string; user?: string }) => {
			data: {
				userId: string;
				authToken: string;
			};
		};
	};

	'/v1/users.create': {
		POST: (params: UserCreateParamsPOST) => {
			user: IUser;
		};
	};

	'/v1/users.update': {
		POST: (params: UsersUpdateParamsPOST) => {
			user: IUser;
		};
	};

	'/v1/users.setActiveStatus': {
		POST: (params: UserSetActiveStatusParamsPOST) => {
			user: IUser;
		};
	};

	'/v1/users.deactivateIdle': {
		POST: (params: UserDeactivateIdleParamsPOST) => {
			count: number;
		};
	};

	'/v1/users.getPresence': {
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
			presence: UserStatus;
			connectionStatus?: 'online' | 'offline' | 'away' | 'busy';
			lastLogin?: string;
		};
	};

	'/v1/users.setStatus': {
		POST: (params: { message?: string; status?: UserStatus; userId?: string; username?: string; user?: string }) => void;
	};

	'/v1/users.getStatus': {
		GET: () => {
			status: 'online' | 'offline' | 'away' | 'busy';
			message?: string;
			_id?: string;
			connectionStatus?: 'online' | 'offline' | 'away' | 'busy';
		};
	};

	'/v1/users.info': {
		GET: (params: UsersInfoParamsGet) => {
			user: IUser & { rooms?: Pick<ISubscription, 'rid' | 'name' | 't' | 'roles' | 'unread'>[] };
		};
	};

	'/v1/users.register': {
		POST: (params: UserRegisterParamsPOST) => {
			user: Partial<IUser>;
		};
	};

	'/v1/users.logout': {
		POST: (params: UserLogoutParamsPOST) => {
			message: string;
		};
	};

	'/v1/users.setPreferences': {
		POST: (params: UsersSetPreferencesParamsPOST) => {
			user: Required<Pick<IUser, '_id' | 'settings'>>;
		};
	};

	'/v1/users.delete': {
		POST: (params: { userId: IUser['_id']; confirmRelinquish?: boolean }) => void;
	};

	'/v1/users.getAvatar': {
		GET: (params: { userId?: string; username?: string; user?: string }) => void;
	};

	'/v1/users.updateOwnBasicInfo': {
		POST: (params: UsersUpdateOwnBasicInfoParamsPOST) => {
			user: IUser;
		};
	};

	'/v1/users.deleteOwnAccount': {
		POST: (params: { password: string; confirmRelinquish?: boolean }) => void;
	};
};

export * from './users/UserCreateParamsPOST';
export * from './users/UserSetActiveStatusParamsPOST';
export * from './users/UserDeactivateIdleParamsPOST';
export * from './users/UsersInfoParamsGet';
export * from './users/UsersListStatusParamsGET';
export * from './users/UsersSendWelcomeEmailParamsPOST';
export * from './users/UserRegisterParamsPOST';
export * from './users/UserLogoutParamsPOST';
export * from './users/UsersListTeamsParamsGET';
export * from './users/UsersAutocompleteParamsGET';
