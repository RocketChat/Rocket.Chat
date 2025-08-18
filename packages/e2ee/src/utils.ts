export type Optional<Obj> = {
	[Key in keyof Obj]: Obj[Key] | null;
};

export interface Ok<V> {
	isOk: true;
	value: V;
}

export interface Err<E> {
	isOk?: undefined; // or isErr: true
	error: E;
}

export type Result<V, E> = Ok<V> | Err<E>;

export const ok = <V>(value: V): Ok<V> => ({ isOk: true, value });

export const err = <E>(error: E): Err<E> => ({ error });
