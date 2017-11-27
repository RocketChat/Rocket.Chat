/* globals Push */

RocketChat.API.v1.addRoute('push.token/:token', { authRequired: true }, {
	delete() {
		const affectedRecords = Push.appCollection.remove({
			$or: [{
				apn: this.urlParams._id
			}, {
				gcm: this.urlParams._id
			}],
			userId: this.userId
		});

		if (affectedRecords === 0) {
			return {
				statusCode: 404
			};
		}

		return RocketChat.API.v1.success();
	}
});
