import { Meteor } from 'meteor/meteor';
import { API } from '../api';

API.v1.addRoute('e2e.fetchMyKeys', { authRequired: true }, {
	get() {
		let result;
		Meteor.runAsUser(this.userId, () => { result = Meteor.call('e2e.fetchMyKeys'); });

		return API.v1.success(result);
	},
});

API.v1.addRoute('e2e.getUsersOfRoomWithoutKey', { authRequired: true }, {
	get() {
		const { rid } = this.queryParams;

		let result;
		Meteor.runAsUser(this.userId, () => { result = Meteor.call('e2e.getUsersOfRoomWithoutKey', rid); });

		return API.v1.success(result);
	},
});

API.v1.addRoute('e2e.setRoomKeyID', { authRequired: true }, {
	post() {
		const { rid, keyID } = this.bodyParams;

		Meteor.runAsUser(this.userId, () => {
			API.v1.success(Meteor.call('e2e.setRoomKeyID', rid, keyID));
		});

		return API.v1.success();
	},
});

API.v1.addRoute('e2e.setUserPublicAndPivateKeys', { authRequired: true }, {
	post() {
		const { public_key, private_key } = this.bodyParams;

		Meteor.runAsUser(this.userId, () => {
			API.v1.success(Meteor.call('e2e.setUserPublicAndPivateKeys', {
				public_key,
				private_key,
			}));
		});

		return API.v1.success();
	},
});

API.v1.addRoute('e2e.updateGroupKey', { authRequired: true }, {
	post() {
		const { uid, rid, key } = this.bodyParams;

		Meteor.runAsUser(this.userId, () => {
			API.v1.success(Meteor.call('e2e.updateGroupKey', rid, uid, key));
		});

		return API.v1.success();
	},
});
