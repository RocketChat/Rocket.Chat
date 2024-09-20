import type { IRoom, IUser } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

type E2eSetUserPublicAndPrivateKeysProps = {
	public_key: string;
	private_key: string;
	force?: boolean;
};

const E2eSetUserPublicAndPrivateKeysSchema = {
	type: 'object',
	properties: {
		public_key: {
			type: 'string',
		},
		private_key: {
			type: 'string',
		},
	},
	required: ['public_key', 'private_key'],
	additionalProperties: false,
};

export const isE2eSetUserPublicAndPrivateKeysProps = ajv.compile<E2eSetUserPublicAndPrivateKeysProps>(E2eSetUserPublicAndPrivateKeysSchema);

type E2eGetUsersOfRoomWithoutKeyProps = { rid: string };

const E2eGetUsersOfRoomWithoutKeySchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
	},
	required: ['rid'],
	additionalProperties: false,
};

export const isE2eGetUsersOfRoomWithoutKeyProps = ajv.compile<E2eGetUsersOfRoomWithoutKeyProps>(E2eGetUsersOfRoomWithoutKeySchema);

type E2eUpdateGroupKeyProps = {
	uid: string;
	rid: string;
	key: string;
};

const E2eUpdateGroupKeySchema = {
	type: 'object',
	properties: {
		uid: {
			type: 'string',
		},
		rid: {
			type: 'string',
		},
		key: {
			type: 'string',
		},
	},
	required: ['uid', 'rid', 'key'],
	additionalProperties: false,
};

export const isE2eUpdateGroupKeyProps = ajv.compile<E2eUpdateGroupKeyProps>(E2eUpdateGroupKeySchema);

type E2eSetRoomKeyIdProps = {
	rid: string;
	keyID: string;
};

const E2eSetRoomKeyIdSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		keyID: {
			type: 'string',
		},
	},
	required: ['rid', 'keyID'],
	additionalProperties: false,
};

export const isE2eSetRoomKeyIdProps = ajv.compile<E2eSetRoomKeyIdProps>(E2eSetRoomKeyIdSchema);

type E2EProvideUsersGroupKeyProps = {
	usersSuggestedGroupKeys: Record<IRoom['_id'], { _id: IUser['_id']; key: string }[]>;
};

const E2EProvideUsersGroupKeySchema = {
	type: 'object',
	properties: {
		usersSuggestedGroupKeys: {
			type: 'object',
			additionalProperties: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						_id: { type: 'string' },
						key: { type: 'string' },
					},
					required: ['_id', 'key'],
					additionalProperties: false,
				},
			},
		},
	},
	required: ['usersSuggestedGroupKeys'],
	additionalProperties: false,
};

export const isE2EProvideUsersGroupKeyProps = ajv.compile<E2EProvideUsersGroupKeyProps>(E2EProvideUsersGroupKeySchema);

type E2EFetchUsersWaitingForGroupKeyProps = { roomIds: string[] };

const E2EFetchUsersWaitingForGroupKeySchema = {
	type: 'object',
	properties: {
		roomIds: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
	},
	required: ['roomIds'],
	additionalProperties: false,
};

export const isE2EFetchUsersWaitingForGroupKeyProps = ajv.compile<E2EFetchUsersWaitingForGroupKeyProps>(
	E2EFetchUsersWaitingForGroupKeySchema,
);

export type E2eEndpoints = {
	'/v1/e2e.setUserPublicAndPrivateKeys': {
		POST: (params: E2eSetUserPublicAndPrivateKeysProps) => void;
	};
	'/v1/e2e.getUsersOfRoomWithoutKey': {
		GET: (params: E2eGetUsersOfRoomWithoutKeyProps) => {
			users: Pick<IUser, '_id' | 'e2e'>[];
		};
	};
	'/v1/e2e.updateGroupKey': {
		POST: (params: E2eUpdateGroupKeyProps) => void;
	};
	'/v1/e2e.acceptSuggestedGroupKey': {
		POST: (params: E2eGetUsersOfRoomWithoutKeyProps) => void;
	};
	'/v1/e2e.rejectSuggestedGroupKey': {
		POST: (params: E2eGetUsersOfRoomWithoutKeyProps) => void;
	};
	'/v1/e2e.setRoomKeyID': {
		POST: (params: E2eSetRoomKeyIdProps) => void;
	};
	'/v1/e2e.fetchMyKeys': {
		GET: () => { public_key: string; private_key: string };
	};
	'/v1/e2e.fetchUsersWaitingForGroupKey': {
		GET: (params: E2EFetchUsersWaitingForGroupKeyProps) => {
			usersWaitingForE2EKeys: Record<IRoom['_id'], { _id: IUser['_id']; public_key: string }[]>;
		};
	};
	'/v1/e2e.provideUsersSuggestedGroupKeys': {
		POST: (params: E2EProvideUsersGroupKeyProps) => void;
	};
};
