import { BSONType } from './types';

export const getBSONType = <T>(v: T): BSONType => {
	if (typeof v === 'number') {
		return BSONType.Double;
	}

	if (typeof v === 'string') {
		return BSONType.String;
	}

	if (typeof v === 'boolean') {
		return BSONType.Boolean;
	}

	if (Array.isArray(v)) {
		return BSONType.Array;
	}

	if (v === null) {
		return BSONType.Null;
	}

	if (v instanceof RegExp) {
		return BSONType.Regex;
	}

	if (typeof v === 'function') {
		return BSONType.JavaScript;
	}

	if (v instanceof Date) {
		return BSONType.Date;
	}

	if (v instanceof Uint8Array) {
		return BSONType.BinData;
	}

	return BSONType.Object;
};

const getBSONTypeOrder = (type: BSONType): number => {
	switch (type) {
		case BSONType.Null:
			return 0;

		case BSONType.Double:
		case BSONType.Int:
		case BSONType.Long:
			return 1;

		case BSONType.String:
		case BSONType.Symbol:
			return 2;

		case BSONType.Object:
			return 3;

		case BSONType.Array:
			return 4;

		case BSONType.BinData:
			return 5;

		case BSONType.ObjectId:
			return 6;

		case BSONType.Boolean:
			return 7;

		case BSONType.Date:
		case BSONType.Timestamp:
			return 8;

		case BSONType.Regex:
			return 9;

		case BSONType.JavaScript:
		case BSONType.JavaScriptWithScope:
			return 100;

		default:
			return -1;
	}
};

type ObjectID = {
	toHexString(): string;
	equals(otherID: ObjectID): boolean;
};

export const compareBSONValues = (a: unknown, b: unknown): number => {
	if (a === undefined) {
		return b === undefined ? 0 : -1;
	}

	if (b === undefined) {
		return 1;
	}

	const ta = getBSONType(a);
	const oa = getBSONTypeOrder(ta);

	const tb = getBSONType(b);
	const ob = getBSONTypeOrder(tb);

	if (oa !== ob) {
		return oa < ob ? -1 : 1;
	}

	if (ta !== tb) {
		throw Error('Missing type coercion logic in compareBSONValues');
	}

	switch (ta) {
		case BSONType.Double:
			return (a as number) - (b as number);

		case BSONType.String:
			return (a as string).localeCompare(b as string);

		case BSONType.Object:
			return compareBSONValues(
				Array.prototype.concat.call([], ...Object.entries(a as Record<string, unknown>)),
				Array.prototype.concat.call([], ...Object.entries(b as Record<string, unknown>)),
			);

		case BSONType.Array: {
			for (let i = 0; ; i++) {
				if (i === (a as unknown[]).length) {
					return i === (b as unknown[]).length ? 0 : -1;
				}

				if (i === (b as unknown[]).length) {
					return 1;
				}

				const s = compareBSONValues((a as unknown[])[i], (b as unknown[])[i]);
				if (s !== 0) {
					return s;
				}
			}
		}

		case BSONType.BinData: {
			if ((a as Uint8Array).length !== (b as Uint8Array).length) {
				return (a as Uint8Array).length - (b as Uint8Array).length;
			}

			for (let i = 0; i < (a as Uint8Array).length; i++) {
				if ((a as Uint8Array)[i] === (b as Uint8Array)[i]) {
					continue;
				}

				return (a as Uint8Array)[i] < (b as Uint8Array)[i] ? -1 : 1;
			}

			return 0;
		}

		case BSONType.Null:
		case BSONType.Undefined:
			return 0;

		case BSONType.ObjectId:
			return (a as ObjectID).toHexString().localeCompare((b as ObjectID).toHexString());

		case BSONType.Boolean:
			return Number(a) - Number(b);

		case BSONType.Date:
			return (a as Date).getTime() - (b as Date).getTime();

		case BSONType.Regex:
			throw Error('Sorting not supported on regular expression');

		case BSONType.JavaScript:
		case BSONType.JavaScriptWithScope:
			throw Error('Sorting not supported on Javascript code');
	}

	throw Error('Unknown type to sort');
};
