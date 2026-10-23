import type { IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';

import { ajv } from './Ajv';

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

type E2eSetRoomKeyIdProps = {
	rid: string;
	keyID: string;
};

type e2eGetUsersOfRoomWithoutKeyParamsGET = {
	rid: string;
};

type e2eUpdateGroupKeyParamsPOST = {
	uid: string;
	rid: string;
	key: string;
};

type E2EFetchUsersWaitingForGroupKeyProps = { roomIds: string[] };

type E2EProvideUsersGroupKeyProps = {
	usersSuggestedGroupKeys: Record<IRoom['_id'], { _id: IUser['_id']; key: string; oldKeys: ISubscription['suggestedOldRoomKeys'] }[]>;
};

type E2EResetRoomKeyProps = {
	rid: string;
	e2eKey: string;
	e2eKeyId: string;
};

// Public mirror of the implementation-derived routes (apps/meteor/server/api/v1/e2e.ts,
// `ExtractRoutesFromAPI<typeof e2eEndpoints>`). Kept identical so the two declarations
// merge without TS2320, and so SDK/external consumers that don't compile apps/meteor keep these routes.
export type E2eEndpoints = {
	'/v1/e2e.setRoomKeyID': {
		POST: (params: E2eSetRoomKeyIdProps) => void;
	};
	'/v1/e2e.requestSubscriptionKeys': {
		POST: (params?: never) => void;
	};
	'/v1/e2e.fetchMyKeys': {
		GET: (params?: never) => { public_key?: string; private_key?: string };
	};
	'/v1/e2e.getUsersOfRoomWithoutKey': {
		GET: (params: e2eGetUsersOfRoomWithoutKeyParamsGET) => { users: Pick<IUser, '_id' | 'e2e'>[] };
	};
	'/v1/e2e.rejectSuggestedGroupKey': {
		POST: (params: e2eGetUsersOfRoomWithoutKeyParamsGET) => void;
	};
	'/v1/e2e.acceptSuggestedGroupKey': {
		POST: (params: e2eGetUsersOfRoomWithoutKeyParamsGET) => void;
	};
	'/v1/e2e.fetchUsersWaitingForGroupKey': {
		GET: (params: E2EFetchUsersWaitingForGroupKeyProps) => {
			usersWaitingForE2EKeys: Record<IRoom['_id'], { _id: IUser['_id']; public_key: string }[]>;
		};
	};
	'/v1/e2e.updateGroupKey': {
		POST: (params: e2eUpdateGroupKeyParamsPOST) => void;
	};
	'/v1/e2e.provideUsersSuggestedGroupKeys': {
		POST: (params: E2EProvideUsersGroupKeyProps) => void;
	};
	'/v1/e2e.resetRoomKey': {
		POST: (params: E2EResetRoomKeyProps) => void;
	};
	'/v1/e2e.setUserPublicAndPrivateKeys': {
		POST: (params: E2eSetUserPublicAndPrivateKeysProps) => void;
	};
};
