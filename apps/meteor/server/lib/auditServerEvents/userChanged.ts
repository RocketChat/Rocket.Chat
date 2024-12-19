import { AsyncLocalStorage } from 'async_hooks';

import type { IAuditServerUserActor, IServerEvents, IUser } from '@rocket.chat/core-typings';
import { ServerEvents } from '@rocket.chat/models';

export const asyncLocalStorage = new AsyncLocalStorage<UserChangedLogStore>();

// some properties are not in type `IUser` but can be changed
type IUserWithExtraLogData = IUser & {
	password?: string;
};
type ChangeRecord<T extends IUser[keyof IUser] = IUserWithExtraLogData[keyof IUser]> = {
	previous?: T;
	current?: T;
};

type UserChangeMap<T extends keyof IUser = keyof IUser, U extends IUser[T] = IUser[T]> = Map<T, ChangeRecord<U>>;
class UserChangedLogStore {
	private changes: UserChangeMap;

	private actor: IAuditServerUserActor;

	private actorType: IAuditServerUserActor['type'];

	constructor(type: IAuditServerUserActor['type'] = 'user') {
		this.changes = new Map();
		this.actorType = type;
		// this.previous = new Map<keyof IUser, IUser[keyof IUser]>();
		// this.current = new Map<keyof IUser, IUser[keyof IUser]>();
		// this.actor = actor;
	}

	public setActor(actor: Omit<IAuditServerUserActor, 'type'>) {
		this.actor = { ...actor, type: this.actorType };
	}

	public insertChangeRecord = (
		record: Partial<IUserWithExtraLogData>,
		build: (record: IUserWithExtraLogData[keyof IUserWithExtraLogData]) => ChangeRecord,
	) => {
		Object.entries(record).forEach(([key, value]) => {
			const property = this.changes.get(key as keyof IUser);

			if (property) {
				this.changes.set(key as keyof IUser, { ...property, ...build(value) });
			}
		});
	};

	public insertPrevious(previous: Partial<IUserWithExtraLogData>) {
		this.insertChangeRecord(previous, (value) => ({ previous: value }));
	}

	public insertCurrent(current: Partial<IUserWithExtraLogData>) {
		this.insertChangeRecord(current, (value) => ({ current: value }));
	}

	public insertBoth(previous: Partial<IUserWithExtraLogData>, current: Partial<IUserWithExtraLogData>) {
		this.insertPrevious(previous);
		this.insertCurrent(current);
	}

	public buildEvent(): IServerEvents['user.changed'] {
		return ['user.changed', this.actor, ...this.changes.entries().map(([key, value]) => ({ id: key, ...value }))];
	}
}

export const auditUserChangeByUser = <T extends (store: typeof asyncLocalStorage, ...args: any[]) => any>(
	fn: T,
): Promise<ReturnType<T>> => {
	const store = new UserChangedLogStore();

	// const originalFn = injectStore(asyncLocalStorage);

	return new Promise<ReturnType<typeof fn>>((resolve) => {
		asyncLocalStorage.run(store, () => {
			void fn(asyncLocalStorage)
				.then(resolve)
				.finally(() => {
					void ServerEvents.createAuditServerEvent(...store.buildEvent());
				});
		});
	});
};

// export const auditUserChangeByUser = <F extends OriginalFunction>(
// 	injectStore: (store: typeof asyncLocalStorage) => F,
// ): Promise<ReturnType<F>> => {
// 	const originalFn = injectStore(asyncLocalStorage);

// 	const store = new UserChangedLogStore();
// 	return new Promise<ReturnType<F>>((resolve) => {
// 		asyncLocalStorage.run(store, () => {
// 			void originalFn()
// 				.then(resolve)
// 				.finally(() => {
// 					void ServerEvents.createAuditServerEvent(...store.buildEvent());
// 				});
// 		});
// 	});
// };
// const auditByUser = (actor: Omit<IAuditServerUserActor, 'type'>) => {
// 	return (fn: (...args: any[]) => any, ...args: any[]) => {
// 		return wrapStore(
// 			{
// 				type: 'user',
// 				...actor,
// 			},
// 			() => fn(...args),
// 		);
// 	};
// };

// export const resetAuditedSettingByUser =
// 	(actor: Omit<IAuditServerUserActor, 'type'>) =>
// 	<F extends (key: ISetting['_id']) => any>(fn: F, key: ISetting['_id']): ReturnType<F> => {
// 		const { value, packageValue } = settings.getSetting(key) ?? {};

// 		void ServerEvents.createAuditServerEvent(
// 			'settings.changed',
// 			{
// 				id: key,
// 				previous: value,
// 				current: packageValue,
// 			},
// 			{
// 				type: 'user',
// 				...actor,
// 			},
// 		);
// 		return fn(key);
// 	};

// export const updateAuditedByUser =
// 	(actor: Omit<IAuditServerUserActor, 'type'>) =>
// 	<K extends ISetting['_id'], T extends ISetting['value'], F extends (_id: K, value: T, ...args: any[]) => any>(
// 		fn: F,
// 		...args: Parameters<F>
// 	): ReturnType<F> => {
// 		const [key, value, ...rest] = args;
// 		const setting = settings.getSetting(key);

// 		const previous = setting?.value;

// 		void ServerEvents.createAuditServerEvent(
// 			'settings.changed',
// 			{
// 				id: key,
// 				previous,
// 				current: value,
// 			},
// 			{
// 				type: 'user',
// 				...actor,
// 			},
// 		);
// 		return fn(key, value, ...rest);
// 	};

// export const updateAuditedBySystem =
// 	(actor: Omit<IAuditServerSystemActor, 'type'>) =>
// 	<T extends ISetting['value'], F extends (_id: ISetting['_id'], value: T, ...args: any[]) => any>(
// 		fn: F,
// 		...args: Parameters<F>
// 	): ReturnType<F> => {
// 		const [key, value, ...rest] = args;
// 		const setting = settings.getSetting(key);

// 		const previous = setting?.value;

// 		void ServerEvents.createAuditServerEvent(
// 			'settings.changed',
// 			{
// 				id: key,
// 				previous,
// 				current: value,
// 			},
// 			{
// 				type: 'system',
// 				...actor,
// 			},
// 		);
// 		return fn(key, value, ...rest);
// 	};

// export const updateAuditedByApp =
// 	<T extends ISetting['value'], F extends (_id: ISetting['_id'], value: T, ...args: any[]) => any>(
// 		actor: Omit<IAuditServerAppActor, 'type'>,
// 	) =>
// 	(fn: F, ...args: Parameters<F>): ReturnType<F> => {
// 		const [key, value, ...rest] = args;
// 		const setting = settings.getSetting(key);

// 		const previous = setting?.value;
// 		void ServerEvents.createAuditServerEvent(
// 			'settings.changed',
// 			{
// 				id: key,
// 				previous,
// 				current: value,
// 			},
// 			{
// 				type: 'app',
// 				...actor,
// 			},
// 		);
// 		return fn(key, value, ...rest);
// 	};
