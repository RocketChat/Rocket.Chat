import { check, Match } from 'meteor/check';

import { API } from '../api';
import { E2EE } from '../../../../server/sdk';

API.v1.addRoute('e2e.fetchMyKeys', { authRequired: true }, {
	async get() {
		const { userId } = this;

		const result = await E2EE.getUserKeys(userId);

		return API.v1.success(result);
	},
});

API.v1.addRoute('e2e.getUsersOfRoomWithoutKey', { authRequired: true }, {
	async get() {
		check(this.queryParams, Match.ObjectIncluding({
			rid: String,
		}));

		const { rid } = this.queryParams;

		const users = await E2EE.getRoomMembersWithoutPublicKey(this.userId, rid);

		return API.v1.success({
			users,
		});
	},
});

API.v1.addRoute('e2e.setRoomKeyID', { authRequired: true }, {
	async post() {
		check(this.bodyParams, Match.ObjectIncluding({
			rid: String,
			keyID: String,
		}));

		const { rid, keyID } = this.bodyParams;

		await E2EE.setRoomKeyId(this.userId, rid, keyID);

		return API.v1.success();
	},
});

API.v1.addRoute('e2e.setUserPublicAndPrivateKeys', { authRequired: true }, {
	async post() {
		check(this.bodyParams, Match.ObjectIncluding({
			// eslint-disable-next-line @typescript-eslint/camelcase
			public_key: String,
			// eslint-disable-next-line @typescript-eslint/camelcase
			private_key: String,
		}));

		// eslint-disable-next-line @typescript-eslint/camelcase
		const { public_key, private_key } = this.bodyParams;

		// eslint-disable-next-line @typescript-eslint/camelcase
		await E2EE.setUserKeys(this.userId, { public_key, private_key });

		return API.v1.success();
	},
});

API.v1.addRoute('e2e.updateGroupKey', { authRequired: true }, {
	async post() {
		check(this.bodyParams, Match.ObjectIncluding({
			uid: String,
			rid: String,
			key: String,
		}));

		const { userId } = this;
		const { uid, rid, key } = this.bodyParams;

		const subscription = await E2EE.updateGroupKey(userId, { uid, rid, keyId: key });

		return API.v1.success(subscription);
	},
});

API.v1.addRoute('e2e.requestSubscriptionKeys', { authRequired: true }, {
	async post() {
		const { userId } = this;

		await E2EE.requestSubscriptionKeys(userId);

		return API.v1.success();
	},
});

API.v1.addRoute('e2e.resetOwnE2EKey', { authRequired: true, twoFactorRequired: true }, {
	async post() {
		const { userId } = this;

		await E2EE.resetUserKeys(userId);

		return API.v1.success(true);
	},
});
