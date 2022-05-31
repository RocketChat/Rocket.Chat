import _ from 'underscore';
import s from 'underscore.string';

import { Base } from './_Base';
import Settings from './Settings';

export class LivechatVisitors extends Base {
	constructor() {
		super('livechat_visitor');

		this.tryEnsureIndex({ token: 1 });
		this.tryEnsureIndex({ 'phone.phoneNumber': 1 }, { sparse: true });
		this.tryEnsureIndex({ 'visitorEmails.address': 1 }, { sparse: true });
		this.tryEnsureIndex({ name: 1 }, { sparse: true });
		this.tryEnsureIndex({ username: 1 });
		this.tryEnsureIndex({ 'contactManager.username': 1 }, { sparse: true });
	}

	/**
	 * Gets visitor by token
	 * @param {string} token - Visitor token
	 */
	getVisitorByToken(token, options) {
		const query = {
			token,
		};

		return this.findOne(query, options);
	}

	/**
	 * Find visitors by _id
	 * @param {string} token - Visitor token
	 */
	findById(_id, options) {
		const query = {
			_id,
		};

		return this.find(query, options);
	}

	/**
	 * Find One visitor by _id
	 */
	findOneById(_id, options) {
		const query = {
			_id,
		};

		return this.findOne(query, options);
	}

	/**
	 * Gets visitor by token
	 * @param {string} token - Visitor token
	 */
	findVisitorByToken(token) {
		const query = {
			token,
		};

		return this.find(query);
	}

	updateLivechatDataByToken(token, key, value, overwrite = true) {
		const query = {
			token,
		};

		if (!overwrite) {
			const user = this.findOne(query, { fields: { livechatData: 1 } });
			if (user.livechatData && typeof user.livechatData[key] !== 'undefined') {
				return true;
			}
		}

		const update = {
			$set: {
				[`livechatData.${key}`]: value,
			},
		};

		return this.update(query, update);
	}

	updateLastAgentByToken(token, lastAgent) {
		const query = {
			token,
		};

		const update = {
			$set: {
				lastAgent,
			},
		};

		return this.update(query, update);
	}

	/**
	 * Find a visitor by their phone number
	 * @return {object} User from db
	 */
	findOneVisitorByPhone(phone) {
		const query = {
			'phone.phoneNumber': phone,
		};

		return this.findOne(query);
	}

	getVisitorsBetweenDate(date) {
		const query = {
			_updatedAt: {
				$gte: date.gte, // ISO Date, ts >= date.gte
				$lt: date.lt, // ISODate, ts < date.lt
			},
		};

		return this.find(query, { fields: { _id: 1 } });
	}

	/**
	 * Get the next visitor name
	 * @return {string} The next visitor name
	 */
	getNextVisitorUsername() {
		const query = {
			_id: 'Livechat_guest_count',
		};

		const update = {
			$inc: {
				value: 1,
			},
		};

		const livechatCount = Settings.findAndModify(query, null, update);

		return `guest-${livechatCount.value.value + 1}`;
	}

	updateById(_id, update) {
		return this.update({ _id }, update);
	}

	saveGuestById(_id, data) {
		const setData = {};
		const unsetData = {};

		if (data.name) {
			if (!_.isEmpty(s.trim(data.name))) {
				setData.name = s.trim(data.name);
			} else {
				unsetData.name = 1;
			}
		}

		if (data.email) {
			if (!_.isEmpty(s.trim(data.email))) {
				setData.visitorEmails = [{ address: s.trim(data.email) }];
			} else {
				unsetData.visitorEmails = 1;
			}
		}

		if (data.phone) {
			if (!_.isEmpty(s.trim(data.phone))) {
				setData.phone = [{ phoneNumber: s.trim(data.phone) }];
			} else {
				unsetData.phone = 1;
			}
		}

		if (data.livechatData) {
			Object.keys(data.livechatData).forEach((key) => {
				const value = s.trim(data.livechatData[key]);
				if (value) {
					setData[`livechatData.${key}`] = value;
				} else {
					unsetData[`livechatData.${key}`] = 1;
				}
			});
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

		return this.update({ _id }, update);
	}

	findOneGuestByEmailAddress(emailAddress) {
		const query = {
			'visitorEmails.address': String(emailAddress).toLowerCase(),
		};

		return this.findOne(query);
	}

	saveGuestEmailPhoneById(_id, emails, phones) {
		const update = {
			$addToSet: {},
		};

		const saveEmail = []
			.concat(emails)
			.filter((email) => email && email.trim())
			.map((email) => ({ address: email }));

		if (saveEmail.length > 0) {
			update.$addToSet.visitorEmails = { $each: saveEmail };
		}

		const savePhone = []
			.concat(phones)
			.filter((phone) => phone && phone.trim().replace(/[^\d]/g, ''))
			.map((phone) => ({ phoneNumber: phone }));

		if (savePhone.length > 0) {
			update.$addToSet.phone = { $each: savePhone };
		}

		if (!update.$addToSet.visitorEmails && !update.$addToSet.phone) {
			return;
		}

		return this.update({ _id }, update);
	}

	// REMOVE
	removeDepartmentById(_id) {
		return this.update({ _id }, { $unset: { department: 1 } });
	}

	removeById(_id) {
		const query = { _id };
		return this.remove(query);
	}

	removeContactManagerByUsername(manager) {
		const query = {
			contactManager: {
				username: manager,
			},
		};
		const update = {
			$unset: {
				contactManager: 1,
			},
		};
		return this.update(query, update);
	}
}

export default new LivechatVisitors();
