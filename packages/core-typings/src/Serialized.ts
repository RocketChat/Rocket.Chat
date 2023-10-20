/* eslint-disable @typescript-eslint/ban-types */

type SerializablePrimitive = boolean | number | string | null;

type UnserializablePrimitive = Function | bigint | symbol | undefined;

type CustomSerializable<T> = {
	toJSON(key: string): T;
};

/**
 * The type of a value that was serialized via `JSON.stringify` and then deserialized via `JSON.parse`.
 */
export type Serialized<T> = T extends CustomSerializable<infer U>
	? Serialized<U>
	: T extends [any, ...any] // is T a tuple?
	? { [K in keyof T]: T extends UnserializablePrimitive ? null : Serialized<T[K]> }
	: T extends any[]
	? Serialized<T[number]>[]
	: T extends object
	? { [K in keyof T]: Serialized<T[K]> }
	: T extends SerializablePrimitive
	? T
	: T extends UnserializablePrimitive
	? undefined
	: null;
