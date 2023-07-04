import type { TOptions } from 'i18next';
import type { RocketchatI18nKeys } from '@rocket.chat/i18n';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { settings } from '../../app/settings/server';
import { i18n } from './i18n';

export const translateForUser = (key: RocketchatI18nKeys, user: Partial<IUser>, options?: TOptions): string => {
	const language = user.language || settings.get<string>('Language') || 'en';
	return i18n.t(key, { lng: language, ...(options ?? {}) });
};

export const translateForUserId = async (key: RocketchatI18nKeys, userId: IUser['_id'], options?: TOptions): Promise<string> => {
	const user = await Users.findOneById(userId, { projection: { language: 1 } });
	return translateForUser(key, user || {}, options);
};
