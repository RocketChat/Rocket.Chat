import { AsyncLocalStorage } from 'async_hooks';

import type {
	IAuditServerUserActor,
	IServerEvents,
	IServerEventAuditedUser,
	ExtractDataToParams,
	IUser,
	DeepPartial,
} from '@rocket.chat/core-typings';
import { ServerEvents } from '@rocket.chat/models';

export const asyncLocalStorage = new AsyncLocalStorage<UserChangedLogStore>();

type AuditedUserEventData<T extends keyof IServerEventAuditedUser = keyof IServerEventAuditedUser> = {
	[K in T]: {
		key: K;
		value: {
			previous?: IServerEventAuditedUser[K];
			current?: IServerEventAuditedUser[K];
		};
	};
}[T];

type UserChangeMap = Map<AuditedUserEventData['key'], AuditedUserEventData>;

const isServerEventData = (data: AuditedUserEventData['value']): data is Required<AuditedUserEventData['value']> => {
	return data.hasOwnProperty('previous') && data.hasOwnProperty('current') && Object.keys(data).length === 2;
};

type Entries<T> = {
	[K in keyof T]: [K, T[K]];
}[keyof T][];

class UserChangedLogStore {
	private changes: UserChangeMap;

	private changedUser: Pick<IUser, '_id' | 'username'> | undefined;

	private actor: IAuditServerUserActor;

	private actorType: IAuditServerUserActor['type'];

	constructor(type: IAuditServerUserActor['type'] = 'user') {
		this.changes = new Map();
		this.actorType = type;
	}

	public setActor(actor: Omit<IAuditServerUserActor, 'type'>) {
		this.actor = { ...actor, type: this.actorType };
	}

	public setUser(user: Pick<IUser, '_id' | 'username'>) {
		this.changedUser = user;
	}

	private insertChangeRecords(_: undefined, record: Partial<IServerEventAuditedUser>): void;

	private insertChangeRecords(record: DeepPartial<IServerEventAuditedUser>, _: undefined): void;

	private insertChangeRecords(...args: [prev?: DeepPartial<IServerEventAuditedUser>, curr?: Partial<IServerEventAuditedUser>]): void {
		const denominator = args[0] ? 'previous' : 'current';
		const record = args[0] || args[1];

		if (!record) return;

		(Object.entries(record) as Entries<IServerEventAuditedUser>).forEach((entry) => {
			if (!entry) return;
			const [key, recordValue] = entry;

			const property = this.changes.get(key);
			if (property) {
				const value = {
					...property.value,
					[denominator]: recordValue,
				};
				this.changes.set(key, { key, value } as AuditedUserEventData);
				return;
			}
			const value = {
				[denominator]: recordValue,
			};
			this.changes.set(key, { value, key } as AuditedUserEventData);
		});
	}

	private getServerEventData(): ExtractDataToParams<IServerEvents['user.changed']> {
		const filtered = Array.from(this.changes.entries()).filter(
			([, { value }]) => isServerEventData(value) && value.previous !== value.current,
		);

		const data = filtered.reduce(
			(acc, [key, { value }]) => {
				return {
					previous: { ...acc.previous, ...{ [key]: value.previous } },
					current: { ...acc.current, ...{ [key]: value.current } },
				};
			},
			{ previous: {}, current: {} },
		);

		return Object.assign(data, { user: { _id: this.changedUser?._id || '', username: this.changedUser?.username } });
	}

	public insertPrevious(previous: DeepPartial<IServerEventAuditedUser>) {
		this.insertChangeRecords(previous, undefined);
	}

	public insertCurrent(current: Partial<IServerEventAuditedUser>) {
		this.insertChangeRecords(undefined, current);
	}

	public insertBoth(previous: Partial<IServerEventAuditedUser>, current: Partial<IServerEventAuditedUser>) {
		this.insertPrevious(previous);
		this.insertCurrent(current);
	}

	public buildEvent(): ['user.changed', ExtractDataToParams<IServerEvents['user.changed']>, IAuditServerUserActor] {
		return ['user.changed', this.getServerEventData(), this.actor];
	}
}

export const auditUserChangeByUser = <T extends (store: typeof asyncLocalStorage, ...args: any[]) => any>(
	fn: T,
): Promise<ReturnType<T>> => {
	const store = new UserChangedLogStore();

	return new Promise<ReturnType<typeof fn>>((resolve) => {
		asyncLocalStorage.run(store, () => {
			void fn(asyncLocalStorage)
				.then(resolve)
				.finally(() => {
					const event = store.buildEvent();
					void ServerEvents.createAuditServerEvent(...event);
				});
		});
	});
};
