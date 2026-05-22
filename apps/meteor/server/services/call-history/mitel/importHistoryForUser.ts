import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import type { MitelConfig } from './definition';
import { fetchMitelHistory } from './fetchMitelHistory';
import { importHistoryItems } from './importHistoryItems';
import { parseMitelJSON } from './parse/parseMitelJSON';

async function getUserDirectoryNumber(uid: IUser['_id']): Promise<string | null> {
	const user = await Users.findOneById<Pick<IUser, '_id' | 'freeSwitchExtension'>>(uid, { projection: { freeSwitchExtension: 1 } });
	return user?.freeSwitchExtension || null;
}

export async function importHistoryForUser(uid: IUser['_id'], config: MitelConfig): Promise<void> {
	const directoryNumber = await getUserDirectoryNumber(uid);
	if (!directoryNumber) {
		return;
	}

	const result = await fetchMitelHistory(directoryNumber, config);
	if (!result) {
		return;
	}

	const callItems = parseMitelJSON(result);
	if (!callItems) {
		return;
	}

	await importHistoryItems(uid, callItems);
}
