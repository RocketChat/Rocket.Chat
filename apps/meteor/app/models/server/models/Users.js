import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { Base } from './_Base';

// The promise.await will die with the model :)
export class Users extends Base {
	constructor(...args) {
		super(...args);

		this.defaultFields = {
			__rooms: 0,
		};

		this.tryEnsureIndex({ __rooms: 1 }, { sparse: 1 });

		this.tryEnsureIndex({ roles: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ name: 1 });
		this.tryEnsureIndex({ bio: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ nickname: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ createdAt: 1 });
		this.tryEnsureIndex({ lastLogin: 1 });
		this.tryEnsureIndex({ status: 1 });
		this.tryEnsureIndex({ statusText: 1 });
		this.tryEnsureIndex({ active: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ statusConnection: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ appId: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ type: 1 });
		this.tryEnsureIndex({ federation: 1 }, { sparse: true });
		this.tryEnsureIndex({ isRemote: 1 }, { sparse: true });
		this.tryEnsureIndex({ 'services.saml.inResponseTo': 1 });
		this.tryEnsureIndex({ openBusinessHours: 1 }, { sparse: true });
		this.tryEnsureIndex({ statusLivechat: 1 }, { sparse: true });
		this.tryEnsureIndex({ extension: 1 }, { sparse: true, unique: true });
		this.tryEnsureIndex({ language: 1 }, { sparse: true });
		this.tryEnsureIndex({ 'active': 1, 'services.email2fa.enabled': 1 }, { sparse: true }); // used by statistics
		this.tryEnsureIndex({ 'active': 1, 'services.totp.enabled': 1 }, { sparse: true }); // used by statistics
	}

	removePersonalAccessTokenOfUser({ userId, loginTokenObject }) {
		return this.update(userId, {
			$pull: {
				'services.resume.loginTokens': loginTokenObject,
			},
		});
	}

	findPersonalAccessTokenByTokenNameAndUserId({ userId, tokenName }) {
		const query = {
			'services.resume.loginTokens': {
				$elemMatch: { name: tokenName, type: 'personalAccessToken' },
			},
			'_id': userId,
		};

		return this.findOne(query);
	}

	findAgents() {
		// TODO: Create class Agent
		const query = {
			roles: 'livechat-agent',
		};

		return this.find(query);
	}

	roleBaseQuery(userId) {
		return { _id: userId };
	}

	/**
	 * @param {IRole['_id'][]} roles the list of role ids
	 * @param {null} scope the value for the role scope (room id) - not used in the users collection
	 * @param {any} options
	 */
	findUsersInRoles(roles, scope, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
		};

		return this.find(query, options);
	}

	findOneByUsernameIgnoringCase(username, options) {
		if (typeof username === 'string') {
			username = new RegExp(`^${escapeRegExp(username)}$`, 'i');
		}

		const query = { username };

		return this.findOne(query, options);
	}

	findOneByUsernameAndServiceNameIgnoringCase(username, userId, serviceName, options) {
		if (typeof username === 'string') {
			username = new RegExp(`^${escapeRegExp(username)}$`, 'i');
		}

		const query = { username, [`services.${serviceName}.id`]: userId };

		return this.findOne(query, options);
	}

	findOneByEmailAddressAndServiceNameIgnoringCase(emailAddress, userId, serviceName, options) {
		const query = {
			'emails.address': new RegExp(`^${escapeRegExp(String(emailAddress).trim())}$`, 'i'),
			[`services.${serviceName}.id`]: userId,
		};

		return this.findOne(query, options);
	}

	findOneByUsername(username, options) {
		const query = { username };

		return this.findOne(query, options);
	}

	findOneByEmailAddress(emailAddress, options) {
		const query = { 'emails.address': String(emailAddress).trim().toLowerCase() };

		return this.findOne(query, options);
	}

	findOneByIdAndLoginToken(_id, token, options) {
		const query = {
			_id,
			'services.resume.loginTokens.hashedToken': token,
		};

		return this.findOne(query, options);
	}

	findOneById(userId, options = {}) {
		const query = { _id: userId };

		return this.findOne(query, options);
	}

	findOneByRolesAndType(roles, type, options) {
		const query = { roles, type };

		return this.findOne(query, options);
	}

	findActive(options = {}) {
		return this.find(
			{
				active: true,
				type: { $nin: ['app'] },
				roles: { $ne: ['guest'] },
			},
			options,
		);
	}

	findActiveLocalGuests(idExceptions = [], options = {}) {
		const query = {
			active: true,
			type: { $nin: ['app'] },
			roles: {
				$eq: 'guest',
				$size: 1,
			},
			isRemote: { $ne: true },
		};

		if (idExceptions) {
			if (!Array.isArray(idExceptions)) {
				idExceptions = [idExceptions];
			}

			query._id = { $nin: idExceptions };
		}

		return this.find(query, options);
	}

	getLastLogin(options = { fields: { _id: 0, lastLogin: 1 } }) {
		options.sort = { lastLogin: -1 };
		options.limit = 1;
		const [user] = this.find({}, options).fetch();
		return user?.lastLogin;
	}

	findUsersByUsernames(usernames, options) {
		const query = {
			username: {
				$in: usernames,
			},
		};

		return this.find(query, options);
	}

	/**
	 * @param {import('mongodb').Filter<import('@rocket.chat/core-typings').IStats>} fields
	 */
	getOldest(fields = { _id: 1 }) {
		const query = {
			_id: {
				$ne: 'rocket.cat',
			},
		};

		const options = {
			fields,
			sort: {
				createdAt: 1,
			},
		};

		return this.findOne(query, options);
	}

	findActiveRemote(options = {}) {
		return this.find(
			{
				active: true,
				isRemote: true,
				roles: { $ne: ['guest'] },
			},
			options,
		);
	}

	findActiveFederated(options = {}) {
		return this.find(
			{
				active: true,
				federated: true,
			},
			options,
		);
	}

	updateLastLoginById(_id) {
		const update = {
			$set: {
				lastLogin: new Date(),
			},
		};

		return this.update(_id, update);
	}

	setServiceId(_id, serviceName, serviceId) {
		const update = { $set: {} };

		const serviceIdKey = `services.${serviceName}.id`;
		update.$set[serviceIdKey] = serviceId;

		return this.update(_id, update);
	}

	setEmailVerified(_id, email) {
		const query = {
			_id,
			emails: {
				$elemMatch: {
					address: email,
					verified: false,
				},
			},
		};

		const update = {
			$set: {
				'emails.$.verified': true,
			},
		};

		return this.update(query, update);
	}

	setAvatarData(_id, origin, etag) {
		const update = {
			$set: {
				avatarOrigin: origin,
				avatarETag: etag,
			},
		};

		return this.update(_id, update);
	}

	resetPasswordAndSetRequirePasswordChange(_id, requirePasswordChange, requirePasswordChangeReason) {
		const update = {
			$unset: {
				'services.password': 1,
			},
			$set: {
				requirePasswordChange,
				requirePasswordChangeReason,
			},
		};

		return this.update(_id, update);
	}

	bannerExistsById(_id, bannerId) {
		const query = {
			_id,
			[`banners.${bannerId}`]: {
				$exists: true,
			},
		};

		return this.find(query).count() !== 0;
	}

	setBannerReadById(_id, bannerId) {
		const update = {
			$set: {
				[`banners.${bannerId}.read`]: true,
			},
		};

		return this.update({ _id }, update);
	}

	removeBannerById(_id, banner) {
		const update = {
			$unset: {
				[`banners.${banner.id}`]: true,
			},
		};

		return this.update({ _id }, update);
	}

	// INSERT
	create(data) {
		const user = {
			createdAt: new Date(),
			avatarOrigin: 'none',
		};

		_.extend(user, data);

		return this.insert(user);
	}

	// REMOVE
	removeById(_id) {
		return this.remove(_id);
	}

	getActiveLocalUserCount() {
		return this.findActive().count() - this.findActiveRemote().count() - this.findActiveFederated().count();
	}

	getActiveLocalGuestCount(idExceptions = []) {
		return this.findActiveLocalGuests(idExceptions).count();
	}
}

export default new Users(Meteor.users, true);
