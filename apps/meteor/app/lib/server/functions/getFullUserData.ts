import { IUser } from '@rocket.chat/core-typings';

import { Logger } from '../../../logger/server';
import { settings } from '../../../settings/server';
import { Users } from '../../../models/server';
import { hasPermission } from '../../../authorization/server';

const logger = new Logger('getFullUserData');

const defaultFields = {
	name: 1,
	username: 1,
	nickname: 1,
	status: 1,
	utcOffset: 1,
	type: 1,
	active: 1,
	bio: 1,
	reason: 1,
	statusText: 1,
	avatarETag: 1,
	extension: 1,
};

const fullFields = {
	emails: 1,
	phone: 1,
	statusConnection: 1,
	bio: 1,
	createdAt: 1,
	lastLogin: 1,
	requirePasswordChange: 1,
	requirePasswordChangeReason: 1,
	roles: 1,
};

let publicCustomFields: Record<string, 1> = {};
let customFields: Record<string, 1> = {};

settings.watch('Accounts_CustomFields', (settingValue: string) => {
	publicCustomFields = {};
	customFields = {};

	const value = settingValue?.trim();
	if (!value) {
		return;
	}

	try {
		const customFieldsOnServer = JSON.parse(value);
		Object.keys(customFieldsOnServer).forEach((key) => {
			const element = customFieldsOnServer[key];
			if (element.public) {
				publicCustomFields[`customFields.${key}`] = 1;
			}
			customFields[`customFields.${key}`] = 1;
		});
	} catch (e) {
		logger.warn(`The JSON specified for "Accounts_CustomFields" is invalid. The following error was thrown: ${e}`);
	}
});

export function getFullUserDataByIdOrUsername({
	userId,
	filterId,
	filterUsername,
}: {
	userId: string;
	filterId?: string;
	filterUsername?: string;
}): IUser | null {
	const caller = Users.findOneById(userId, { fields: { username: 1 } });
	const targetUser = filterId || filterUsername;
	const myself = (filterId && targetUser === userId) || (filterUsername && targetUser === caller.username);
	const canViewAllInfo = !!myself || hasPermission(userId, 'view-full-other-user-info');

	const fields = {
		...defaultFields,
		...(canViewAllInfo && fullFields),
		...(canViewAllInfo ? customFields : publicCustomFields),
		...(myself && { services: 1 }),
	};

	const user = Users.findOneByIdOrUsername(targetUser, { fields });
	if (!user) {
		return null;
	}

	user.canViewAllInfo = canViewAllInfo;

	return user;
}
