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

		const users = await Users.findAllBySipIdentifiers<Pick<IRegisterUser, '_id' | 'name' | 'username' | 'sipExtension' | 'phones'>>(
			numbers,
			{
				projection: { name: 1, username: 1, sipExtension: 1, phones: 1 },
			},
		).toArray();

		for (const user of users) {
			const { sipExtension, phones = [], ...userData } = user;

			const mitelSipExtension = normalizeMitelNumber(sipExtension);
			if (mitelSipExtension && numbers.includes(mitelSipExtension)) {
				map.set(mitelSipExtension, userData);
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
