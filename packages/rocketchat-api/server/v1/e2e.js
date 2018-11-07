import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.API.v1.addRoute('e2e.fetchMyKeys', { authRequired: true }, {
	get() {
		let result;
		Meteor.runAsUser(this.userId, () => result = Meteor.call('e2e.fetchMyKeys'));

		return RocketChat.API.v1.success(result);
	},
});

RocketChat.API.v1.addRoute('e2e.getUsersOfRoomWithoutKey', { authRequired: true }, {
	get() {
		const { rid } = this.queryParams;

		let result;
		Meteor.runAsUser(this.userId, () => result = Meteor.call('e2e.getUsersOfRoomWithoutKey', rid));

		return RocketChat.API.v1.success(result);
	},
});

RocketChat.API.v1.addRoute('e2e.setRoomKeyID', { authRequired: true }, {
	post() {
		const { rid, keyID } = this.bodyParams;

		Meteor.runAsUser(this.userId, () => {
			RocketChat.API.v1.success(Meteor.call('e2e.setRoomKeyID', rid, keyID));
		});

		return RocketChat.API.v1.success();
	},
});

RocketChat.API.v1.addRoute('e2e.setUserPublicAndPivateKeys', { authRequired: true }, {
	post() {
		const { public_key, private_key } = this.bodyParams;

		Meteor.runAsUser(this.userId, () => {
			RocketChat.API.v1.success(Meteor.call('e2e.setUserPublicAndPivateKeys', {
				public_key,
				private_key,
			}));
		});

		return RocketChat.API.v1.success();
	},
});

RocketChat.API.v1.addRoute('e2e.updateGroupKey', { authRequired: true }, {
	post() {
		const { uid, rid, key } = this.bodyParams;

		Meteor.runAsUser(this.userId, () => {
			RocketChat.API.v1.success(Meteor.call('e2e.updateGroupKey', rid, uid, key));
		});

		return RocketChat.API.v1.success();
	},
});
