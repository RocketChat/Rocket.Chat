type SerializableFields = boolean | number | string | null | undefined;

type SerializableFieldsToString = Date;

/**
 * Base Serialized type. Common use to serialize objects to send to the client using JSON.stringify.
 *
 * You can define different types for the fields that should be serialized to string.
 */

export type Serialized<T, S = SerializableFields, F = SerializableFieldsToString> = T extends S
	? T
	: T extends F
	? Exclude<T, F> | string
	: T extends Record<string, unknown>
	? {
			[K in keyof T]: Serialized<T[K], S, F>;
	  }
	: null;

export type RESTSerialized<T> = Serialized<T>;

export type DDPSerialized<T> = Serialized<T, boolean | number | string | null | undefined | Date>;
