import _ from 'underscore';
import Busboy from 'busboy';

RocketChat.API.v1.addRoute('users.create', { authRequired: true }, {
	post() {
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

		if (this.bodyParams.customFields) {
			RocketChat.validateCustomFields(this.bodyParams.customFields);
		}

		const newUserId = RocketChat.saveUser(this.userId, this.bodyParams);

		if (this.bodyParams.customFields) {
			RocketChat.saveCustomFieldsWithoutValidation(newUserId, this.bodyParams.customFields);
		}


		if (typeof this.bodyParams.active !== 'undefined') {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('setUserActiveStatus', newUserId, this.bodyParams.active);
			});
		}

		return RocketChat.API.v1.success({ user: RocketChat.models.Users.findOneById(newUserId, { fields: RocketChat.API.v1.defaultFieldsToExclude }) });
	}
});

RocketChat.API.v1.addRoute('users.delete', { authRequired: true }, {
	post() {
		if (!RocketChat.authz.hasPermission(this.userId, 'delete-user')) {
			return RocketChat.API.v1.unauthorized();
		}

		const user = this.getUserFromParams();

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('deleteUser', user._id);
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('users.getAvatar', { authRequired: false }, {
	get() {
		const user = this.getUserFromParams();

		const url = RocketChat.getURL(`/avatar/${ user.username }`, { cdn: false, full: true });
		this.response.setHeader('Location', url);

		return {
			statusCode: 307,
			body: url
		};
	}
});

RocketChat.API.v1.addRoute('users.getPresence', { authRequired: true }, {
	get() {
		if (this.isUserFromParams()) {
			const user = RocketChat.models.Users.findOneById(this.userId);
			return RocketChat.API.v1.success({
				presence: user.status,
				connectionStatus: user.statusConnection,
				lastLogin: user.lastLogin
			});
		}

		const user = this.getUserFromParams();

		return RocketChat.API.v1.success({
			presence: user.status
		});
	}
});

RocketChat.API.v1.addRoute('users.info', { authRequired: true }, {
	get() {
		const user = this.getUserFromParams();

		let result;
		Meteor.runAsUser(this.userId, () => {
			result = Meteor.call('getFullUserData', { filter: user.username, limit: 1 });
		});

		if (!result || result.length !== 1) {
			return RocketChat.API.v1.failure(`Failed to get the user data for the userId of "${ user._id }".`);
		}

		return RocketChat.API.v1.success({
			user: result[0]
		});
	}
});

RocketChat.API.v1.addRoute('users.list', { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-d-room')) {
			return RocketChat.API.v1.unauthorized();
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const users = RocketChat.models.Users.find(query, {
			sort: sort ? sort : { username: 1 },
			skip: offset,
			limit: count,
			fields
		}).fetch();

		return RocketChat.API.v1.success({
			users,
			count: users.length,
			offset,
			total: RocketChat.models.Users.find(query).count()
		});
	}
});

RocketChat.API.v1.addRoute('users.register', { authRequired: false }, {
	post() {
		if (this.userId) {
			return RocketChat.API.v1.failure('Logged in users can not register again.');
		}

		//We set their username here, so require it
		//The `registerUser` checks for the other requirements
		check(this.bodyParams, Match.ObjectIncluding({
			username: String
		}));

		//Register the user
		const userId = Meteor.call('registerUser', this.bodyParams);

		//Now set their username
		Meteor.runAsUser(userId, () => Meteor.call('setUsername', this.bodyParams.username));

		return RocketChat.API.v1.success({ user: RocketChat.models.Users.findOneById(userId, { fields: RocketChat.API.v1.defaultFieldsToExclude }) });
	}
});

RocketChat.API.v1.addRoute('users.resetAvatar', { authRequired: true }, {
	post() {
		const user = this.getUserFromParams();

		if (user._id === this.userId) {
			Meteor.runAsUser(this.userId, () => Meteor.call('resetAvatar'));
		} else if (RocketChat.authz.hasPermission(this.userId, 'edit-other-user-info')) {
			Meteor.runAsUser(user._id, () => Meteor.call('resetAvatar'));
		} else {
			return RocketChat.API.v1.unauthorized();
		}

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('users.setAvatar', { authRequired: true }, {
	post() {
		check(this.bodyParams, Match.ObjectIncluding({
			avatarUrl: Match.Maybe(String),
			userId: Match.Maybe(String),
			username: Match.Maybe(String)
		}));

		let user;
		if (this.isUserFromParams()) {
			user = Meteor.users.findOne(this.userId);
		} else if (RocketChat.authz.hasPermission(this.userId, 'edit-other-user-info')) {
			user = this.getUserFromParams();
		} else {
			return RocketChat.API.v1.unauthorized();
		}

		Meteor.runAsUser(user._id, () => {
			if (this.bodyParams.avatarUrl) {
				RocketChat.setUserAvatar(user, this.bodyParams.avatarUrl, '', 'url');
			} else {
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

					}));
					this.request.pipe(busboy);
				})();
			}
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('users.update', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			userId: String,
			data: Match.ObjectIncluding({
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
			})
		});

		const userData = _.extend({ _id: this.bodyParams.userId }, this.bodyParams.data);

		Meteor.runAsUser(this.userId, () => RocketChat.saveUser(this.userId, userData));

		if (this.bodyParams.data.customFields) {
			RocketChat.saveCustomFields(this.bodyParams.userId, this.bodyParams.data.customFields);
		}

		if (typeof this.bodyParams.data.active !== 'undefined') {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('setUserActiveStatus', this.bodyParams.userId, this.bodyParams.data.active);
			});
		}

		return RocketChat.API.v1.success({ user: RocketChat.models.Users.findOneById(this.bodyParams.userId, { fields: RocketChat.API.v1.defaultFieldsToExclude }) });
	}
});

RocketChat.API.v1.addRoute('users.createToken', { authRequired: true }, {
	post() {
		const user = this.getUserFromParams();
		let data;
		Meteor.runAsUser(this.userId, () => {
			data = Meteor.call('createToken', user._id);
		});
		return data ? RocketChat.API.v1.success({data}) : RocketChat.API.v1.unauthorized();
	}
});

/**
	This API returns the logged user roles.

	Method: GET
	Route: api/v1/user.roles
 */
RocketChat.API.v1.addRoute('user.roles', { authRequired: true }, {
	get() {
		let result;
		var currentUserRoles = {};

		Meteor.runAsUser(this.userId, () =>
			result = Meteor.call('getUserRoles')
		);

		if (Array.isArray(result) && result.length > 0) {
			currentUserRoles = result[0]
		}

		return RocketChat.API.v1.success(currentUserRoles);
	}
});

