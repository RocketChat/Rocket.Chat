import { AsyncLocalStorage } from 'async_hooks';

import type { IAuditServerUserActor, IServerEvents, ExtractDataToParams, IUser } from '@rocket.chat/core-typings';
import { ServerEvents } from '@rocket.chat/models';
// import { StringMap } from 'esl';

export const asyncLocalStorage = new AsyncLocalStorage<UserChangedLogStore>();

// const shouldBeSerialized = (value: any): boolean => {
// 	if (value instanceof Object) {
// 		return true;
// 	}

// 	return false;
// };
const keysToObfuscate = ['authorizedClients', 'e2e', 'inviteToken', 'oauth'];

type DeepKeys = [string, Array<string | DeepKeys>];
type ExtractedKeys = Array<string | DeepKeys>;

const extractKeysFromRecord = (a: Record<string, any>, b: Record<string, any>): ExtractedKeys => {
	const keys: ExtractedKeys = [];
	for (const key in a) {
		if (!a.hasOwnProperty(key) && !b.hasOwnProperty(key)) {
			continue;
		}

		if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
			keys.push(key);
			continue;
		}

		if (Array.isArray(a[key]) || Array.isArray(b[key])) {
			if (!Array.isArray(a[key]) || !Array.isArray(b[key])) {
				keys.push(key);
				continue;
			}
			if (a[key].length !== b[key].length) {
				keys.push(key);
				continue;
			}
			// Not sure if array values should be strictly compared or not
			if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
				keys.push(key);
				continue;
			}
		}

		if (a[key] instanceof Date) {
			if (a[key].getTime() !== b[key].getTime()) {
				keys.push(key);
				continue;
			}
		}

		if (a[key] instanceof Object) {
			const deepKeys = extractKeysFromRecord(a[key], b[key]);
			if (deepKeys.length) {
				keys.push([key, deepKeys]);
			}
			continue;
		}

		if (a[key] !== b[key]) {
			keys.push(key);
		}
	}

	return keys;
};

const obfuscateServices = (services: Record<string, any>): Record<string, any> => {
	return Object.fromEntries(
		Object.keys(services).map((key) => {
			// Email 2FA is okay, only tells if it's enabled
			if (key === 'email2fa') {
				return [key, services[key]];
			}
			return [key, '***'];
		}),
	);
};

const buildUserRecord = (
	keys: ExtractedKeys,
	originalRecord: Record<string, any>,
	currentRecord: Record<string, any>,
): [Record<string, any>, Record<string, any>] => {
	const record: [Record<string, any>, Record<string, any>] = keys.reduce(
		(acc, key) => {
			const actualKey = typeof key === 'string' ? key : key[0];
			if (keysToObfuscate.includes(actualKey)) {
				return [
					{ ...acc[0], [actualKey]: '***' },
					{ ...acc[1], [actualKey]: '***' },
				];
			}
			if (Array.isArray(key)) {
				const [field, subFields] = key;
				const [original, current] = buildUserRecord(subFields, originalRecord[field], currentRecord[field]);

				return [
					{ ...acc[0], [field]: original },
					{ ...acc[1], [field]: current },
				];
			}

			return [
				{ ...acc[0], [key]: originalRecord[key] },
				{ ...acc[1], [key]: currentRecord[key] },
			];
		},
		[{}, {}],
	);

	// Obfuscate all services
	// TODO: so ugly
	if (record[0].services && typeof record[0].services === 'object') {
		record[0].services = obfuscateServices(record[0].services);
	}
	if (record[1].services && typeof record[1].services === 'object') {
		record[1].services = obfuscateServices(record[1].services);
	}

	return record;
};
class UserChangedLogStore {
	private originalUser: IUser | undefined;

	private currentUser: IUser | undefined;

	private actor: IAuditServerUserActor;

	private actorType: IAuditServerUserActor['type'];

	constructor(type: IAuditServerUserActor['type'] = 'user') {
		this.actorType = type;
	}

	public setOriginalUser(user: IUser) {
		this.originalUser = user;
	}

	public setCurrentUser(user: IUser) {
		this.currentUser = user;
	}

	public setActor(actor: Omit<IAuditServerUserActor, 'type'>) {
		this.actor = { ...actor, type: this.actorType };
	}

	private getUserDelta(originalUser: IUser, currentUser: IUser): [Partial<IUser>, Partial<IUser>] {
		const changedFields = extractKeysFromRecord(originalUser, currentUser);
		const [original, current] = buildUserRecord(changedFields, originalUser, currentUser);

		return [original, current];
	}

	private getEventData(originalUser: IUser, currentUser: IUser): ExtractDataToParams<IServerEvents['user.changed']> {
		const [previous, current] = this.getUserDelta(originalUser, currentUser);

		return {
			user: { _id: currentUser?._id || '', username: currentUser?.username },
			previous,
			current,
		};
	}

	public buildEvent(): ['user.changed', ExtractDataToParams<IServerEvents['user.changed']>, IAuditServerUserActor] {
		// Not sure what to do if either are undefined/empty
		// Option 1: we assume no changes were made, and don't do anything
		// Option 2: we dispatch the event anyway, but this could cause artifacts in the data
		// Option 3: we do nothing and throw an error, but that would halt the request
		// Option 4: we do nothing and throw a log warning
		// Option N: a combination of the above
		// For now I'm keeping the event empty to at least signify an attempt of changing the user.
		if (!this.originalUser || !this.currentUser) {
			console.warn(
				`users.changed - Partial auditing exception - Failed to extract record's Delta\n
				This might mean no changes were made, or there was an issue registering the users information`,
			);
			return [
				'user.changed',
				{
					user: {
						_id: this.currentUser?._id || '',
						username: this.currentUser?.username,
					},
					previous: {},
					current: {},
				},
				this.actor,
			];
		}

		// There's a chance that the delta is empty, but there are no definitions as to wether to waive
		// the event or not.
		return ['user.changed', this.getEventData(this.originalUser, this.currentUser), this.actor];
	}
}

export const auditUserChangeByUser = <T extends (store: typeof asyncLocalStorage, ...args: any[]) => any>(
	fn: T,
): Promise<ReturnType<T>> => {
	const store = new UserChangedLogStore();

	// Wrapping is necessary because asyncLocalStorage.enterWith(store) is marked as Experimental
	// so doing this avoids possible issues.
	return new Promise<ReturnType<typeof fn>>((resolve, reject) => {
		asyncLocalStorage.run(store, () => {
			void fn(asyncLocalStorage)
				.then(resolve)
				.catch(reject)
				.then(() => {
					const event = store.buildEvent();
					void ServerEvents.createAuditServerEvent(...event);
				});
		});
	});
};
