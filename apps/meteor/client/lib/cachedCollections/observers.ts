/* eslint-disable @typescript-eslint/naming-convention */

export interface UnorderedObserver<T extends { _id: string }, TThis = any> {
	added: (this: TThis, id: T['_id'], fields: Partial<T>) => void | Promise<void>;
	changed: (this: TThis, id: T['_id'], fields: Partial<T>) => void | Promise<void>;
	removed: (this: TThis, id: T['_id']) => void | Promise<void>;
}

export interface OrderedObserver<T extends { _id: string }, TThis = any> extends UnorderedObserver<T, TThis> {
	addedBefore: (this: TThis, id: T['_id'], fields: Partial<T>, before: T['_id'] | null) => void | Promise<void>;
	movedBefore: (this: TThis, id: T['_id'], before: T['_id'] | null) => void | Promise<void>;
}

export type Observer<T extends { _id: string }, TThis = any> = UnorderedObserver<T, TThis> | OrderedObserver<T, TThis>;
