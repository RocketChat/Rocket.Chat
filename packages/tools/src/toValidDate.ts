/**
 * Coerces an untrusted value into a `Date`, or `undefined` when it does not describe a moment.
 *
 * Use it on any boundary where a date arrives from outside the process — an app over msgpack,
 * a REST body, a DDP payload — and reaches code that assumes a real `Date`. An invalid string
 * would otherwise become an `Invalid Date` that silently matches nothing in Mongo.
 *
 * `0` is a valid timestamp and returns the epoch. An empty string, `null` and `undefined` do not.
 */
export const toValidDate = (value: Date | string | number | null | undefined): Date | undefined => {
	if (value === null || value === undefined || value === '') {
		return undefined;
	}

	const date = value instanceof Date ? value : new Date(value);

	return Number.isNaN(date.getTime()) ? undefined : date;
};
