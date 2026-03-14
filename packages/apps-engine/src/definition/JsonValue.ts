/**
 * Represents a value that can be serialized across the apps-engine boundary.
 * Includes all JSON-compatible types as well as `Date` objects.
 */
export type SerializableValue =
	| string
	| number
	| boolean
	| null
	| Date
	| SerializableValue[]
	| { [key: string]: SerializableValue };
