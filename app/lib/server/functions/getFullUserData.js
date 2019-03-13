import s from 'underscore.string';
import { Logger } from '/app/logger';
import { settings } from '/app/settings';
import { Users } from '/app/models';
import { hasPermission } from '/app/authorization';

const logger = new Logger('getFullUserData');

const defaultFields = {
	name: 1,
	username: 1,
	status: 1,
	utcOffset: 1,
	type: 1,
	active: 1,
	reason: 1,
};

const fullFields = {
	emails: 1,
	phone: 1,
	statusConnection: 1,
	createdAt: 1,
	lastLogin: 1,
	services: 1,
	requirePasswordChange: 1,
	requirePasswordChangeReason: 1,
	roles: 1,
};

let publicCustomFields = {};
let customFields = {};

settings.get('Accounts_CustomFields', (key, value) => {
	publicCustomFields = {};
	customFields = {};

	if (!value.trim()) {
		return;
	}

	try {
		const customFieldsOnServer = JSON.parse(value.trim());
		Object.keys(customFieldsOnServer).forEach((key) => {
			const element = customFieldsOnServer[key];
			if (element.public) {
				publicCustomFields[`customFields.${ key }`] = 1;
			}
			customFields[`customFields.${ key }`] = 1;
		});
	} catch (e) {
		logger.warn(`The JSON specified for "Accounts_CustomFields" is invalid. The following error was thrown: ${ e }`);
	}
});

export const getFullUserData = function({ userId, filter, limit: l }) {
	const username = s.trim(filter);
	const userToRetrieveFullUserData = Users.findOneByUsername(username);
	const isMyOwnInfo = userToRetrieveFullUserData && userToRetrieveFullUserData._id === userId;
	const viewFullOtherUserInfo = hasPermission(userId, 'view-full-other-user-info');
	const limit = !viewFullOtherUserInfo ? 1 : l;

	if (!username && limit <= 1) {
		return undefined;
	}

	const _customFields = isMyOwnInfo || viewFullOtherUserInfo ? customFields : publicCustomFields;

	const fields = viewFullOtherUserInfo ? { ...defaultFields, ...fullFields, ..._customFields } : { ...defaultFields, ..._customFields };

	const options = {
		fields,
		limit,
		sort: { username: 1 },
	};

	if (!username) {
		return Users.find({}, options);
	}
	if (limit === 1) {
		return Users.findByUsername(username, options);
	}
	const usernameReg = new RegExp(s.escapeRegExp(username), 'i');
	return Users.findByUsernameNameOrEmailAddress(usernameReg, options);
};
