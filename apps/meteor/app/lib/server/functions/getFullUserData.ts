import type { IUser, IUserEmail } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { settings } from '../../../settings/server';

const logger = new Logger('getFullUserData');

export const defaultFields = {
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
	federated: 1,
	statusLivechat: 1,
	abacAttributes: 1,
	freeSwitchExtension: 1,
} as const;

export const fullFields = {
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
		logger.warn({
			msg: 'The JSON specified for "Accounts_CustomFields" is invalid. The following error was thrown',
			err: e,
		});
	}
});

const getCustomFields = (canViewAllInfo: boolean): Record<string, 0 | 1> => (canViewAllInfo ? customFields : publicCustomFields);

const getFields = (canViewAllInfo: boolean): Record<string, 0 | 1> => ({
	...defaultFields,
	...(canViewAllInfo && fullFields),
	...getCustomFields(canViewAllInfo),
});

const findTargetUser = (type: string, value: string, opts: any) => {
	if (type === 'importId') return Users.findOneByImportId(value, opts);
	if (type === 'email') return Users.findOneByEmailAddress(value, opts);
	if (type === 'freeSwitchExtension') return Users.findOneByFreeSwitchExtension(value, opts);
	return Users.findOneByIdOrUsername(value, opts);
};

export async function getFullUserDataByUniqueSearchTerm(
	userId: string,
	searchValue: string,
	searchType: 'id' | 'username' | 'importId' | 'email' | 'freeSwitchExtension',
): Promise<IUser | null> {
	const caller = await Users.findOneById(userId, { projection: { username: 1, importIds: 1, emails: 1, freeSwitchExtension: 1 } });

	if (!caller) {
		return null;
	}

	const myself =
		(searchType === 'id' && searchValue === userId) ||
		(searchType === 'username' && searchValue === caller.username) ||
		(searchType === 'importId' && caller.importIds?.includes(searchValue)) ||
		(searchType === 'freeSwitchExtension' && caller.freeSwitchExtension === searchValue) ||
		(searchType === 'email' &&
			caller.emails?.some((email: IUserEmail) => email.address.trim().toLowerCase() === searchValue.trim().toLowerCase()));

	const canViewAllInfo = !!myself || (await hasPermissionAsync(userId, 'view-full-other-user-info'));

	// Only search for importId/email if the user has permission to view them
	if (['importId', 'email'].includes(searchType) && !canViewAllInfo) {
		return null;
	}

	const fields = getFields(canViewAllInfo);

	const options = {
		projection: {
			...fields,
			...(myself && { services: 1 }),
		},
	};

	const user = await findTargetUser(searchType, searchValue, options);

	if (!user) {
		return null;
	}

	user.canViewAllInfo = canViewAllInfo;

	if (user?.services?.password) {
		(user.services.password as any) = true;
	}

	delete user?.services?.passwordHistory;
	delete user?.services?.resume;
	delete user?.services?.email;

	return user;
}
