import { AsyncLocalStorage } from 'async_hooks';

import type { IAuditServerUserActor, IServerEvents, ExtractDataToParams, IUser } from '@rocket.chat/core-typings';
import { ServerEvents } from '@rocket.chat/models';

export const asyncLocalStorage = new AsyncLocalStorage<UserChangedLogStore>();

const shouldBeSerialized = (value: any): boolean => {
	if (value instanceof Object) {
		return true;
	}

	return false;
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
		const changedFields = Object.keys(originalUser).filter((_key: unknown) => {
			const key = _key as keyof IUser;
			// This is not the most optimal solution as differences in order can affect the result.
			// It's probably okay, if the order changes, an operation was done to the fields
			// and we want to audit it.
			if (shouldBeSerialized(originalUser[key]) || shouldBeSerialized(currentUser[key])) {
				try {
					return JSON.stringify(originalUser[key]) !== JSON.stringify(currentUser[key]);
				} catch {
					// do nothing
				}
			}
			return originalUser[key] !== currentUser[key];
		});

		if (changedFields.length) {
			return changedFields.reduce(
				(acc, key) => [
					{ ...acc[0], [key]: originalUser[key as keyof IUser] },
					{ ...acc[1], [key]: currentUser[key as keyof IUser] },
				],
				[{}, {}],
			);
		}

		// No changed fields
		return [{}, {}];
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
