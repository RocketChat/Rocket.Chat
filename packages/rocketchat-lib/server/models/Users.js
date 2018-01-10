import _ from 'underscore';
import s from 'underscore.string';

class ModelUsers extends RocketChat.models._Base {
	constructor() {
		super(...arguments);

		this.tryEnsureIndex({'roles': 1}, {sparse: 1});
		this.tryEnsureIndex({'name': 1});
		this.tryEnsureIndex({'lastLogin': 1});
		this.tryEnsureIndex({'status': 1});
		this.tryEnsureIndex({'active': 1}, {sparse: 1});
		this.tryEnsureIndex({'statusConnection': 1}, {sparse: 1});
		this.tryEnsureIndex({'type': 1});

		this.cache.ensureIndex('username', 'unique');
	}

	findOneByImportId(_id, options) {
		return this.findOne({importIds: _id}, options);
	}

	findOneByUsername(username, options) {
		if (typeof username === 'string') {
			username = new RegExp(`^${ username }$`, 'i');
		}

		const query = {username};

		return this.findOne(query, options);
	}

	findOneByEmailAddress(emailAddress, options) {
		const query = {'emails.address': new RegExp(`^${ s.escapeRegExp(emailAddress) }$`, 'i')};

		return this.findOne(query, options);
	}

	findOneAdmin(admin, options) {
		const query = {admin};

		return this.findOne(query, options);
	}

	findOneByIdAndLoginToken(_id, token, options) {
		const query = {
			_id,
			'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(token)
		};

		return this.findOne(query, options);
	}


	// FIND
	findById(userId) {
		const query = {_id: userId};

		return this.find(query);
	}

	findUsersNotOffline(options) {
		const query = {
			username: {
				$exists: 1
			},
			status: {
				$in: ['online', 'away', 'busy']
			}
		};

		return this.find(query, options);
	}


	findByUsername(username, options) {
		const query = {username};

		return this.find(query, options);
	}

	findUsersByUsernamesWithHighlights(usernames, options) {
		if (this.useCache) {
			const result = {
				fetch() {
					return RocketChat.models.Users.getDynamicView('highlights').data().filter(record => usernames.indexOf(record.username) > -1);
				},
				count() {
					return result.fetch().length;
				},
				forEach(fn) {
					return result.fetch().forEach(fn);
				}
			};
			return result;
		}

		const query = {
			username: {$in: usernames},
			'settings.preferences.highlights.0': {
				$exists: true
			}
		};

		return this.find(query, options);
	}

	findActiveByUsernameOrNameRegexWithExceptions(searchTerm, exceptions, options) {
		if (exceptions == null) {
			exceptions = [];
		}
		if (options == null) {
			options = {};
		}
		if (!_.isArray(exceptions)) {
			exceptions = [exceptions];
		}

		const termRegex = new RegExp(s.escapeRegExp(searchTerm), 'i');
		const query = {
			$or: [{
				username: termRegex
			}, {
				name: termRegex
			}],
			active: true,
			type: {
				$in: ['user', 'bot']
			},
			$and: [{
				username: {
					$exists: true
				}
			}, {
				username: {
					$nin: exceptions
				}
			}]
		};

		return this.find(query, options);
	}

	findByActiveUsersExcept(searchTerm, exceptions, options) {
		if (exceptions == null) {
			exceptions = [];
		}
		if (options == null) {
			options = {};
		}
		if (!_.isArray(exceptions)) {
			exceptions = [exceptions];
		}

		const termRegex = new RegExp(s.escapeRegExp(searchTerm), 'i');

		const orStmt = _.reduce(RocketChat.settings.get('Accounts_SearchFields').trim().split(','), function(acc, el) {
			acc.push({[el.trim()]: termRegex});
			return acc;
		}, []);
		const query = {
			$and: [
				{
					active: true,
					$or: orStmt
				},
				{
					username: {$exists: true, $nin: exceptions}
				}
			]
		};

		// do not use cache
		return this._db.find(query, options);
	}

	findUsersByNameOrUsername(nameOrUsername, options) {
		const query = {
			username: {
				$exists: 1
			},

			$or: [
				{name: nameOrUsername},
				{username: nameOrUsername}
			],

			type: {
				$in: ['user']
			}
		};

		return this.find(query, options);
	}

	findByUsernameNameOrEmailAddress(usernameNameOrEmailAddress, options) {
		const query = {
			$or: [
				{name: usernameNameOrEmailAddress},
				{username: usernameNameOrEmailAddress},
				{'emails.address': usernameNameOrEmailAddress}
			],
			type: {
				$in: ['user', 'bot']
			}
		};

		return this.find(query, options);
	}

	findLDAPUsers(options) {
		const query = {ldap: true};

		return this.find(query, options);
	}

	findCrowdUsers(options) {
		const query = {crowd: true};

		return this.find(query, options);
	}

	getLastLogin(options) {
		if (options == null) {
			options = {};
		}
		const query = {lastLogin: {$exists: 1}};
		options.sort = {lastLogin: -1};
		options.limit = 1;
		const [user] = this.find(query, options).fetch();
		return user && user.lastLogin;
	}

	findUsersByUsernames(usernames, options) {
		const query = {
			username: {
				$in: usernames
			}
		};

		return this.find(query, options);
	}

	findUsersByIds(ids, options) {
		const query = {
			_id: {
				$in: ids
			}
		};
		return this.find(query, options);
	}

	// UPDATE
	addImportIds(_id, importIds) {
		importIds = [].concat(importIds);

		const query = {_id};

		const update = {
			$addToSet: {
				importIds: {
					$each: importIds
				}
			}
		};

		return this.update(query, update);
	}

	updateLastLoginById(_id) {
		const update = {
			$set: {
				lastLogin: new Date
			}
		};

		return this.update(_id, update);
	}

	setServiceId(_id, serviceName, serviceId) {
		const update =
			{$set: {}};

		const serviceIdKey = `services.${ serviceName }.id`;
		update.$set[serviceIdKey] = serviceId;

		return this.update(_id, update);
	}

	setUsername(_id, username) {
		const update =
			{$set: {username}};

		return this.update(_id, update);
	}

	setEmail(_id, email) {
		const update = {
			$set: {
				emails: [{
					address: email,
					verified: false
				}
				]
			}
		};

		return this.update(_id, update);
	}

	setEmailVerified(_id, email) {
		const query = {
			_id,
			emails: {
				$elemMatch: {
					address: email,
					verified: false
				}
			}
		};

		const update = {
			$set: {
				'emails.$.verified': true
			}
		};

		return this.update(query, update);
	}

	setName(_id, name) {
		const update = {
			$set: {
				name
			}
		};

		return this.update(_id, update);
	}

	setCustomFields(_id, fields) {
		const values = {};
		Object.keys(fields).forEach(key => {
			values[`customFields.${ key }`] = fields[key];
		});

		const update = {$set: values};

		return this.update(_id, update);
	}

	setAvatarOrigin(_id, origin) {
		const update = {
			$set: {
				avatarOrigin: origin
			}
		};

		return this.update(_id, update);
	}

	unsetAvatarOrigin(_id) {
		const update = {
			$unset: {
				avatarOrigin: 1
			}
		};

		return this.update(_id, update);
	}

	setUserActive(_id, active) {
		if (active == null) {
			active = true;
		}
		const update = {
			$set: {
				active
			}
		};

		return this.update(_id, update);
	}

	setAllUsersActive(active) {
		const update = {
			$set: {
				active
			}
		};

		return this.update({}, update, {multi: true});
	}

	unsetLoginTokens(_id) {
		const update = {
			$set: {
				'services.resume.loginTokens': []
			}
		};

		return this.update(_id, update);
	}

	unsetRequirePasswordChange(_id) {
		const update = {
			$unset: {
				'requirePasswordChange': true,
				'requirePasswordChangeReason': true
			}
		};

		return this.update(_id, update);
	}

	resetPasswordAndSetRequirePasswordChange(_id, requirePasswordChange, requirePasswordChangeReason) {
		const update = {
			$unset: {
				'services.password': 1
			},
			$set: {
				requirePasswordChange,
				requirePasswordChangeReason
			}
		};

		return this.update(_id, update);
	}

	setLanguage(_id, language) {
		const update = {
			$set: {
				language
			}
		};

		return this.update(_id, update);
	}

	setProfile(_id, profile) {
		const update = {
			$set: {
				'settings.profile': profile
			}
		};

		return this.update(_id, update);
	}

	setPreferences(_id, preferences) {
		const update = {
			$set: {
				'settings.preferences': preferences
			}
		};

		return this.update(_id, update);
	}

	setUtcOffset(_id, utcOffset) {
		const query = {
			_id,
			utcOffset: {
				$ne: utcOffset
			}
		};

		const update = {
			$set: {
				utcOffset
			}
		};

		return this.update(query, update);
	}

	confirmGlobalAnnouncementRead(_id) {
		const update = {
			$set: {
				globalAnnouncementRead: new Date()
			}
		};

		return this.update(_id, update);
	}

	saveUserById(_id, data) {
		const setData = {};
		const unsetData = {};

		if (data.name != null) {
			if (!_.isEmpty(s.trim(data.name))) {
				setData.name = s.trim(data.name);
			} else {
				unsetData.name = 1;
			}
		}

		if (data.email != null) {
			if (!_.isEmpty(s.trim(data.email))) {
				setData.emails = [{address: s.trim(data.email)}];
			} else {
				unsetData.emails = 1;
			}
		}

		if (data.phone != null) {
			if (!_.isEmpty(s.trim(data.phone))) {
				setData.phone = [{phoneNumber: s.trim(data.phone)}];
			} else {
				unsetData.phone = 1;
			}
		}

		const update = {};

		if (!_.isEmpty(setData)) {
			update.$set = setData;
		}

		if (!_.isEmpty(unsetData)) {
			update.$unset = unsetData;
		}

		if (_.isEmpty(update)) {
			return true;
		}

		return this.update({_id}, update);
	}

	// INSERT
	create(data) {
		const user = {
			createdAt: new Date,
			avatarOrigin: 'none'
		};

		_.extend(user, data);

		return this.insert(user);
	}


	// REMOVE
	removeById(_id) {
		return this.remove(_id);
	}

	/*
Find users to send a message by email if:
- he is not online
- has a verified email
- has not disabled email notifications
- `active` is equal to true (false means they were deactivated and can't login)
*/
	getUsersToSendOfflineEmail(usersIds) {
		const query = {
			_id: {
				$in: usersIds
			},
			active: true,
			status: 'offline',
			statusConnection: {
				$ne: 'online'
			},
			'emails.verified': true
		};

		const options = {
			fields: {
				name: 1,
				username: 1,
				emails: 1,
				'settings.preferences.emailNotificationMode': 1,
				language: 1
			}
		};

		return this.find(query, options);
	}
}

RocketChat.models.Users = new ModelUsers(Meteor.users, true);
