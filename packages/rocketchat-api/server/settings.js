// settings endpoints
RocketChat.API.v1.addRoute('settings/:_id', { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-privileged-setting')) {
			return RocketChat.API.v1.failure('Forbidden');
		}

		return {
			success: true,
			data: _.pick(RocketChat.models.Settings.findOneNotHiddenById(this.urlParams._id), '_id', 'value')
		};
	},
	post() {
		if (!RocketChat.authz.hasPermission(this.userId, 'edit-privileged-setting')) {
			return RocketChat.API.v1.failure('Forbidden');
		}

		if (!this.bodyParams.hasOwnProperty('value')) {
			return RocketChat.API.v1.failure('Body param "value" is required');
		}

		try {
			RocketChat.models.Settings.updateValueNotHiddenById(this.urlParams._id, this.bodyParams.value);

			return { success: true };
		} catch (e) {
			return RocketChat.API.v1.failure(e);
		}
	}
});
