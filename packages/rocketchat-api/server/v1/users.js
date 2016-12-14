RocketChat.API.v1.addRoute('users.create', { authRequired: true }, {
	post: function() {
		try {
			check(this.bodyParams, {
				email: String,
				name: String,
				password: String,
				username: String,
				active: Match.Maybe(Boolean),
				roles: Match.Maybe(Array),
				joinDefaultChannels: Match.Maybe(Boolean),
				requirePasswordChange: Match.Maybe(Boolean),
				sendWelcomeEmail: Match.Maybe(Boolean),
				verified: Match.Maybe(Boolean),
				customFields: Match.Maybe(Object)
			});

			//New change made by pull request #5152
			if (typeof this.bodyParams.joinDefaultChannels === 'undefined') {
				this.bodyParams.joinDefaultChannels = true;
			}

			const newUserId = RocketChat.saveUser(this.userId, this.bodyParams);

			if (this.bodyParams.customFields) {
				RocketChat.saveCustomFields(newUserId, this.bodyParams.customFields);
			}

			if (this.bodyParams.active === false) {
				Meteor.runAsUser(this.userId, () => {
					Meteor.call('setUserActiveStatus', newUserId, false);
				});
			}

			return RocketChat.API.v1.success({ user: RocketChat.models.Users.findOneById(newUserId) });
		} catch (e) {
			return RocketChat.API.v1.failure(e.name + ': ' + e.message);
		}
	}
});

RocketChat.API.v1.addRoute('users.delete', { authRequired: true }, {
	post: function() {
		if (!RocketChat.authz.hasPermission(this.userId, 'delete-user')) {
			return RocketChat.API.v1.unauthorized();
		}

		if (!this.bodyParams.userId) {
			return RocketChat.API.v1.failure('Body param "userId" is required');
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('deleteUser', this.bodyParams.userId);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(e.name + ': ' + e.message);
		}

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('users.getPresence', { authRequired: true }, {
	get: function() {
		if (this.queryParams.userId && this.userId !== this.queryParams.userId) {
			if (RocketChat.models.Users.find({ _id: this.queryParams.userId }).count() !== 1) {
				return RocketChat.API.v1.failure(`Failed to find a user with the id of "${this.queryParams.userId}"`);
			}

			const user = RocketChat.models.Users.findOneById(this.queryParams.userId, { fields: { status: 1 }});
			return RocketChat.API.v1.success({
				presence: user.status
			});
		}

		const user = RocketChat.models.Users.findOneById(this.userId);
		return RocketChat.API.v1.success({
			presence: user.status,
			connectionStatus: user.statusConnection,
			lastLogin: user.lastLogin
		});
	}
});

RocketChat.API.v1.addRoute('users.info', { authRequired: true }, {
	get: function() {
		if (!this.queryParams.userId) {
			return RocketChat.API.v1.failure('The query parameter "userId" must be supplied.');
		}

		const user = RocketChat.models.Users.findOneById(this.queryParams.userId);

		if (!user) {
			return RocketChat.API.v1.failure(`No user was found with the id of "${this.queryParams.userId}"`);
		}

		let result = undefined;
		try {
			Meteor.runAsUser(this.userId, () => {
				result = Meteor.call('getFullUserData', { filter: user.username, limit: 1 });
			});
		} catch (e) {
			return RocketChat.API.v1.failure(e.name + ': ' + e.message);
		}

		if (!result || result.length !== 1) {
			return RocketChat.API.v1.failure(`Failed to get the user data for the userId of "${this.queryParams.userId}".`);
		}

		return RocketChat.API.v1.success({
			user: result[0]
		});
	}
});

RocketChat.API.v1.addRoute('users.list', { authRequired: true }, {
	get: function() {
		let result = undefined;
		try {
			Meteor.runAsUser(this.userId, () => {
				result = Meteor.call('getFullUserData', {});
			});
		} catch (e) {
			return RocketChat.API.v1.failure(e.name + ': ' + e.message);
		}

		if (!result) {
			return RocketChat.API.v1.failure('Failed to get the users data.');
		}

		return RocketChat.API.v1.success({
			users: result
		});
	}
});

RocketChat.API.v1.addRoute('users.setAvatar', { authRequired: true }, {
	post: function() {
		try {
			check(this.bodyParams, { avatarUrl: Match.Maybe(String), userId: Match.Maybe(String) });

			if (typeof this.bodyParams.userId !== 'undefined' && this.userId !== this.bodyParams.userId && !RocketChat.authz.hasPermission(this.userId, 'edit-other-user-info')) {
				return RocketChat.API.v1.unauthorized();
			}

			const user = Meteor.users.findOne(this.bodyParams.userId ? this.bodyParams.userId : this.userId);

			if (this.bodyParams.avatarUrl) {
				RocketChat.setUserAvatar(user, this.bodyParams.avatarUrl, '', 'url');
			} else {
				const Busboy = Npm.require('busboy');
				const busboy = new Busboy({ headers: this.request.headers });

				Meteor.wrapAsync((callback) => {
					busboy.on('file', Meteor.bindEnvironment((fieldname, file, filename, encoding, mimetype) => {
						if (fieldname !== 'image') {
							return callback(new Meteor.Error('invalid-field'));
						}

						const imageData = [];
						file.on('data', Meteor.bindEnvironment((data) => {
							imageData.push(data);
						}));

						file.on('end', Meteor.bindEnvironment(() => {
							RocketChat.setUserAvatar(user, Buffer.concat(imageData), mimetype, 'rest');
							callback();
						}));

						this.request.pipe(busboy);
					}));
				})();
			}
		} catch (e) {
			return RocketChat.API.v1.failure(e.name + ': ' + e.message);
		}

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('users.update', { authRequired: true }, {
	post: function() {
		try {
			check(this.bodyParams, {
				userId: String,
				data: {
					email: Match.Maybe(String),
					name: Match.Maybe(String),
					password: Match.Maybe(String),
					username: Match.Maybe(String),
					active: Match.Maybe(Boolean),
					roles: Match.Maybe(Array),
					joinDefaultChannels: Match.Maybe(Boolean),
					requirePasswordChange: Match.Maybe(Boolean),
					sendWelcomeEmail: Match.Maybe(Boolean),
					verified: Match.Maybe(Boolean),
					customFields: Match.Maybe(Object)
				}
			});

			const userData = _.extend({ _id: this.bodyParams.userId }, this.bodyParams.data);

			RocketChat.saveUser(this.userId, userData);

			if (this.bodyParams.data.customFields) {
				RocketChat.saveCustomFields(this.bodyParams.userId, this.bodyParams.data.customFields);
			}

			if (typeof this.bodyParams.data.active !== 'undefined') {
				Meteor.runAsUser(this.userId, () => {
					Meteor.call('setUserActiveStatus', this.bodyParams.userId, this.bodyParams.data.active);
				});
			}

			return RocketChat.API.v1.success({ user: RocketChat.models.Users.findOneById(this.bodyParams.userId) });
		} catch (e) {
			return RocketChat.API.v1.failure(e.name + ': ' + e.message);
		}
	}
});
