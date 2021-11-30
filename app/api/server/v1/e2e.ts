import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { API } from '../api';
import { E2E } from '../../../../server/sdk';

API.v1.addRoute('e2e.fetchMyKeys', { authRequired: true }, {
	async get() {
		const uid = Meteor.userId();
		if (!uid) {
			return API.v1.failure('Invalid user');
		}

		const result = await E2E.getUserKeys(uid);

		return API.v1.success(result);
	},
});

API.v1.addRoute('e2e.getUsersOfRoomWithoutKey', { authRequired: true }, {
	async get() {
		const { rid } = this.queryParams;

		check(rid, String);

		const uid = Meteor.userId();
		if (!uid) {
			return API.v1.failure('Invalid user');
		}

		if (!rid) {
			return API.v1.failure('Invalid room');
		}

		const users = await E2E.getRoomMembersWithoutPublicKey(uid, rid);

		return API.v1.success({
			users,
		});
	},
});

API.v1.addRoute('e2e.setRoomKeyID', { authRequired: true }, {
	async post() {
		const { rid, keyID } = this.bodyParams;

		check(rid, String);
		check(keyID, String);

		const userId = Meteor.userId();
		if (!userId) {
			return API.v1.failure('Invalid user');
		}

		if (!rid) {
			return API.v1.failure('Invalid room');
		}

		await E2E.setRoomKeyId(userId, rid, keyID);

		return API.v1.success();
	},
});
