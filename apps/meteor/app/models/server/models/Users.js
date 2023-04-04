import { Meteor } from 'meteor/meteor';
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

	findOneByEmailAddress(emailAddress, options) {
		const query = { 'emails.address': String(emailAddress).trim().toLowerCase() };

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
}

export default new Users(Meteor.users, true);
