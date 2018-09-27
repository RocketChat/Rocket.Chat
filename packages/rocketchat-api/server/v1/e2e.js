RocketChat.API.v1.addRoute('e2e.fetchKeychain', { authRequired: true }, {
	get() {
		const { uid } = this.queryParams;

		let result;
		Meteor.runAsUser(this.userId, () => result = Meteor.call('fetchKeychain', uid));

		return RocketChat.API.v1.success(result);
	},
});

RocketChat.API.v1.addRoute('e2e.fetchMyKeys', { authRequired: true }, {
	get() {
		let result;
		Meteor.runAsUser(this.userId, () => result = Meteor.call('fetchMyKeys'));

		return RocketChat.API.v1.success(result);
	},
});

RocketChat.API.v1.addRoute('e2e.addKeyToChain', { authRequired: true }, {
	post() {
		const { RSAPubKey, RSAEPrivKey } = this.bodyParams;

		Meteor.runAsUser(this.userId, () => {
			RocketChat.API.v1.success(Meteor.call('addKeyToChain', {
				public_key: RSAPubKey,
				private_key: RSAEPrivKey,
			}));
		});

		return RocketChat.API.v1.success();
	},
});

RocketChat.API.v1.addRoute('e2e.updateGroupE2EKey', { authRequired: true }, {
	post() {
		const { uid, rid, key } = this.bodyParams;

		Meteor.runAsUser(this.userId, () => {
			RocketChat.API.v1.success(Meteor.call('updateGroupE2EKey', rid, uid, key));
		});

		return RocketChat.API.v1.success();
	},
});
