import type { IUser } from '@rocket.chat/core-typings';

export type E2eEndpoints = {
	'/v1/e2e.setUserPublicAndPrivateKeys': {
		POST: (params: { public_key: string; private_key: string }) => void;
	};
	'/v1/e2e.getUsersOfRoomWithoutKey': {
		GET: (params: { rid: string }) => {
			users: Pick<IUser, '_id' | 'e2e'>[];
		};
	};
	'/v1/e2e.updateGroupKey': {
		POST: (params: { uid: string; rid: string; key: string }) => {};
	};
	'/v1/e2e.setRoomKeyID': {
		POST: (params: { rid: string; keyID: string }) => {};
	};
	'/v1/e2e.fetchMyKeys': {
		GET: () => { public_key: string; private_key: string };
	};
};
