import type { IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { settings } from '../../../settings/server';

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
	freeSwitchExtension: 1,
	federated: 1,
	statusLivechat: 1,
} as const;

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
	importIds: 1,
} as const;

let publicCustomFields: Record<string, 0 | 1> = {};
let customFields: Record<string, 0 | 1> = {};

settings.watch<string>('Accounts_CustomFields', (settingValue) => {
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

const getCustomFields = (canViewAllInfo: boolean): Record<string, 0 | 1> => (canViewAllInfo ? customFields : publicCustomFields);

const getFields = (canViewAllInfo: boolean): Record<string, 0 | 1> => ({
	...defaultFields,
	...(canViewAllInfo && fullFields),
	...getCustomFields(canViewAllInfo),
});

export async function getFullUserDataByIdOrUsernameOrImportId(
	userId: string,
	searchValue: string,
	searchType: 'id' | 'username' | 'importId',
): Promise<IUser | null> {
	const caller = await Users.findOneById(userId, { projection: { username: 1, importIds: 1 } });
	if (!caller) {
		return null;
	}
	const myself =
		(searchType === 'id' && searchValue === userId) ||
		(searchType === 'username' && searchValue === caller.username) ||
		(searchType === 'importId' && caller.importIds?.includes(searchValue));
	const canViewAllInfo = !!myself || (await hasPermissionAsync(userId, 'view-full-other-user-info'));

	// Only search for importId if the user has permission to view the import id
	if (searchType === 'importId' && !canViewAllInfo) {
		return null;
	}

	const fields = getFields(canViewAllInfo);

	const options = {
		projection: {
			...fields,
			...(myself && { services: 1 }),
		},
	};

	const user = await (searchType === 'importId'
		? Users.findOneByImportId(searchValue, options)
		: Users.findOneByIdOrUsername(searchValue, options));
	if (!user) {
		return null;
	}

	user.canViewAllInfo = canViewAllInfo;

	if (user?.services?.password) {
		(user.services.password as any) = true;
	}

	return user;
}
