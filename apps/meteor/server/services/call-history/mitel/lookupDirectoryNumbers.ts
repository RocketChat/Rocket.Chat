import type { IRegisterUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import type { MitelCallItem } from './definition';
import { getAllDirectoryNumbers } from './getAllDirectoryNumbers';
import { normalizeMitelNumber } from './normalizeMitelNumber';
import { logger } from '../logger';

type DirectoryLookupUser = Pick<IRegisterUser, '_id' | 'name' | 'username'>;

export async function lookupDirectoryNumbers(items: MitelCallItem[]): Promise<Map<string, DirectoryLookupUser>> {
	const map = new Map<string, DirectoryLookupUser>();
	try {
		const numbers = getAllDirectoryNumbers(items);

		if (!numbers.length) {
			return map;
		}

		const users = await Users.findAllBySipIdentifiers<Pick<IRegisterUser, '_id' | 'name' | 'username' | 'freeSwitchExtension' | 'phones'>>(
			numbers,
			{
				projection: { name: 1, username: 1, freeSwitchExtension: 1, phones: 1 },
			},
		).toArray();

		for (const user of users) {
			const { freeSwitchExtension, phones = [], ...userData } = user;

			const sipExtension = normalizeMitelNumber(freeSwitchExtension);
			if (sipExtension && numbers.includes(sipExtension)) {
				map.set(sipExtension, userData);
			}

			for (const { number } of phones) {
				const phoneNumber = normalizeMitelNumber(number);
				if (!phoneNumber || !numbers.includes(phoneNumber)) {
					continue;
				}
				if (!map.has(phoneNumber)) {
					map.set(phoneNumber, userData);
				}
			}
		}
	} catch (err) {
		logger.error({ msg: 'Failed to lookup history numbers', err });
	}

	return map;
}
