/* globals Push */

RocketChat.API.v1.addRoute('push.token', { authRequired: true }, {
	post() {
		const { type, value, appName } = this.bodyParams;
		let { id } = this.bodyParams;

		if (id && typeof id !== 'string') {
			throw new Meteor.Error('error-id-param-not-valid', 'The required "id" body param is invalid.');
		} else {
			id = Random.id();
		}

		if (!type || (type !== 'apn' && type !== 'gcm')) {
			throw new Meteor.Error('error-type-param-not-valid', 'The required "type" body param is missing or invalid.');
		}

		if (!value || typeof value !== 'string') {
			throw new Meteor.Error('error-token-param-not-valid', 'The required "token" body param is missing or invalid.');
		}

		if (!appName || typeof appName !== 'string') {
			throw new Meteor.Error('error-appName-param-not-valid', 'The required "appName" body param is missing or invalid.');
		}


		let result;
		Meteor.runAsUser(this.userId, () => result = Meteor.call('raix:push-update', {
			id,
			token: { [type]: value },
			appName,
			userId: this.userId
		}));

		return RocketChat.API.v1.success({ result });
	},
	delete() {
		const { token } = this.bodyParams;

		if (!token || typeof token !== 'string') {
			throw new Meteor.Error('error-token-param-not-valid', 'The required "token" body param is missing or invalid.');
		}

		const affectedRecords = Push.appCollection.remove({
			$or: [{
				'token.apn': token
			}, {
				'token.gcm': token
			}],
			userId: this.userId
		});

		if (affectedRecords === 0) {
			return RocketChat.API.v1.notFound();
		}

		return RocketChat.API.v1.success();
	}
});
