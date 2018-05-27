/* globals RocketChat */
import _ from 'underscore';
import s from 'underscore.string';

RocketChat.getFullUserData = function({userId, filter, limit}) {
	let fields = {
		name: 1,
		username: 1,
		status: 1,
		utcOffset: 1,
		type: 1,
		active: 1,
		reason: 1
	};

	if (RocketChat.authz.hasPermission(userId, 'view-full-other-user-info')) {
		fields = _.extend(fields, {
			emails: 1,
			phone: 1,
			statusConnection: 1,
			createdAt: 1,
			lastLogin: 1,
			services: 1,
			requirePasswordChange: 1,
			requirePasswordChangeReason: 1,
			roles: 1
		});
	} else if (limit !== 0) {
		limit = 1;
	}

	const metaCustomFields = RocketChat.settings.get('Accounts_CustomFields').trim();
	let sCustomFields;
	try {
		sCustomFields = JSON.parse(metaCustomFields);

		if (sCustomFields) {
			_.each(sCustomFields, (el, key) => {
				if (el.public || RocketChat.authz.hasPermission(userId, 'view-full-other-user-info')) {
					fields[`customFields.${ key }`] = 1;
				}
			});
		}
	} catch (e) {
		if (metaCustomFields !== '') {
			console.log('Invalid custom account fields!');
		}
	}

	filter = s.trim(filter);

	if (!filter && limit === 1) {
		return undefined;
	}

	const options = {
		fields,
		limit,
		sort: { username: 1 }
	};

	if (filter) {
		if (limit === 1) {
			return RocketChat.models.Users.findByUsername(filter, options);
		} else {
			const filterReg = new RegExp(s.escapeRegExp(filter), 'i');
			return RocketChat.models.Users.findByUsernameNameOrEmailAddress(filterReg, options);
		}
	}

	return RocketChat.models.Users.find({}, options);
};
