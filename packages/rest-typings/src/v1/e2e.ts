import type { IUser } from '@rocket.chat/core-typings';

export type E2eEndpoints = {
	'e2e.setUserPublicAndPrivateKeys': {
		POST: (params: { public_key: string; private_key: string }) => void;
	};
	'e2e.getUsersOfRoomWithoutKey': {
		GET: (params: { rid: string }) => {
			users: Pick<IUser, '_id' | 'e2e'>[];
		};
	};
	'e2e.updateGroupKey': {
		POST: (params: { uid: string; rid: string; key: string }) => {};
	};
	'e2e.setRoomKeyID': {
		POST: (params: { rid: string; keyID: string }) => {};
	};
	'e2e.fetchMyKeys': {
		GET: () => { public_key: string; private_key: string };
	};
};
