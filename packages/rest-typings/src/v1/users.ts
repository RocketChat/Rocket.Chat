import type { IExportOperation, ITeam, IUser } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

type UsersInfo = { userId?: IUser['_id']; userName?: IUser['username'] };

const UsersInfoSchema = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
			nullable: true,
		},
		userName: {
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

type UsersAutocomplete = { selector: string };

const UsersAutocompleteSchema = {
	type: 'object',
	properties: {
		selector: {
			type: 'string',
		},
	},
	required: ['selector'],
	additionalProperties: false,
};

export const isUsersAutocompleteProps = ajv.compile<UsersAutocomplete>(UsersAutocompleteSchema);

type UsersListTeams = { userId: IUser['_id'] };

const UsersListTeamsSchema = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
		},
	},
	required: ['userId'],
	additionalProperties: false,
};

export const isUsersListTeamsProps = ajv.compile<UsersListTeams>(UsersListTeamsSchema);

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
	'users.info': {
		GET: (params: UsersInfo) => {
			user: IUser;
		};
	};
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
		GET: (params: UsersAutocomplete) => {
			items: Required<Pick<IUser, '_id' | 'name' | 'username' | 'nickname' | 'status' | 'avatarETag'>>[];
		};
	};

	'users.listTeams': {
		GET: (params: UsersListTeams) => { teams: ITeam[] };
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

	'users.logout': {
		POST: (params: { userId?: string }) => {
			message: string;
		};
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
				name: string;
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
};
