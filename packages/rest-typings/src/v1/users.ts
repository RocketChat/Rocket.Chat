import type { ITeam, IUser } from '@rocket.chat/core-typings';
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
	'users.2fa.sendEmailCode': {
		POST: (params: Users2faSendEmailCode) => void;
	};
	'users.autocomplete': {
		GET: (params: UsersAutocomplete) => {
			items: Required<Pick<IUser, '_id' | 'name' | 'username' | 'nickname' | 'status' | 'avatarETag'>>[];
		};
	};
	'users.listTeams': {
		GET: (params: UsersListTeams) => { teams: Array<ITeam> };
	};
	'users.setAvatar': {
		POST: (params: UsersSetAvatar) => void;
	};
	'users.resetAvatar': {
		POST: (params: UsersResetAvatar) => void;
	};
};
