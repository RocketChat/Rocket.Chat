import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import type { MitelConfig } from './definition';
import { fetchMitelHistory } from './fetchMitelHistory';
import { importHistoryItems } from './importHistoryItems';
import { logger } from '../logger';
import { parseMitelJSON } from './parse/parseMitelJSON';

async function getUserDirectoryNumber(uid: IUser['_id']): Promise<string | null> {
	const user = await Users.findOneById<Pick<IUser, '_id' | 'freeSwitchExtension'>>(uid, { projection: { freeSwitchExtension: 1 } });
	return user?.freeSwitchExtension || null;
}

async function processFetchedHistory(uid: IUser['_id'], result: string | null): Promise<void> {
	if (!result) {
		return;
	}

	const callItems = parseMitelJSON(result);
	if (!callItems) {
		return;
	}

	await importHistoryItems(uid, callItems);
}

async function fetchAndImportHistory(user: { directoryNumber: string; uid: IUser['_id'] }, config: MitelConfig): Promise<void> {
	const { timeout } = config;

	if (!timeout) {
		const result = await fetchMitelHistory(user.directoryNumber, config);
		return processFetchedHistory(user.uid, result);
	}

	// Set a timeout so that the request to the external service doesn't prevent our API request from working
	let promiseDecided = false;
	return new Promise((resolve, reject) => {
		fetchMitelHistory(user.directoryNumber, config)
			.then((result) => {
				const newPromise = processFetchedHistory(user.uid, result);

				if (promiseDecided) {
					return;
				}

				promiseDecided = true;
				// If the request completes successfully we can process its data, even if the timeout was already reached
				newPromise.then(resolve).catch((err) => {
					logger.error({ msg: 'Unexpected error on external call history processing', err });
					resolve();
				});
			})
			.catch((err) => {
				if (promiseDecided) {
					logger.error({ msg: 'Unexpected error on external call history processing', err });
					return;
				}
				promiseDecided = true;
				reject(err as Error);
			});

		setTimeout(() => {
			if (promiseDecided) {
				return;
			}

			promiseDecided = true;
			resolve();
		}, timeout);
	});
}

export async function importHistoryForUser(uid: IUser['_id'], config: MitelConfig): Promise<void> {
	const directoryNumber = await getUserDirectoryNumber(uid);
	if (!directoryNumber) {
		return;
	}

	return fetchAndImportHistory({ directoryNumber, uid }, config);
}
