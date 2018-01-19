RocketChat.API.v1.addRoute('e2e.fetchGroupE2EKey', { authRequired: true }, {
	get() {
		const rid = this.queryParams.rid;

		let result;
		Meteor.runAsUser(this.userId, () => result = Meteor.call('fetchGroupE2EKey', rid));

		return RocketChat.API.v1.success(result);
	}
});

RocketChat.API.v1.addRoute('e2e.fetchKeychain', { authRequired: true }, {
	get() {
		const uid = this.queryParams.uid;

		let result;
		Meteor.runAsUser(this.userId, () => result = Meteor.call('fetchGroupE2EKey', uid));

		return RocketChat.API.v1.success(result);
	}
});

RocketChat.API.v1.addRoute('e2e.fetchMyKeys', { authRequired: true }, {
	get() {
		let result;
		Meteor.runAsUser(this.userId, () => result = Meteor.call('fetchMyKeys'));

		return RocketChat.API.v1.success(result);
	}
});

RocketChat.API.v1.addRoute('rooms.addKeyToChain', { authRequired: true }, {
	post() {
		const RSAPubKey = this.bodyParams.RSAPubKey;
		const RSAEPrivKey = this.bodyParams.RSAEPrivKey;
		
		Meteor.runAsUser(this.userId, () => {
			RocketChat.API.v1.success(Meteor.call('addKeyToChain', {'RSA-PubKey': RSAPubKey, 'RSA-EPrivKey': RSAEPrivKey}));
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('rooms.emptyKeychain', { authRequired: true }, {
	post() {
		Meteor.runAsUser(this.userId, () => {
			RocketChat.API.v1.success(Meteor.call('emptyKeychain'));
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('rooms.updateGroupE2EKey', { authRequired: true }, {
	post() {
		const uid = this.bodyParams.uid;
		const rid = this.bodyParams.rid;
		const key = this.bodyParams.key;

		Meteor.runAsUser(this.userId, () => {
			RocketChat.API.v1.success(Meteor.call('updateGroupE2EKey', rid, uid, key));
		});

		return RocketChat.API.v1.success();
	}
});