import { EJSON } from './ejson.ts';
import { Random } from './random';

const _looksLikeObjectID = (str: string) => str.length === 24 && /^[0-9a-f]*$/.test(str);

export class ObjectID {
	private _str: string;

	constructor(hexString?: string) {
		if (hexString) {
			hexString = hexString.toLowerCase();
			if (!_looksLikeObjectID(hexString)) {
				throw new Error('Invalid hexadecimal string for creating an ObjectID');
			}
			this._str = hexString;
		} else {
			this._str = Random.hexString(24);
		}
	}

	equals(other: unknown): boolean {
		return other instanceof ObjectID && this.valueOf() === other.valueOf();
	}

	toString(): string {
		return `ObjectID("${this._str}")`;
	}

	clone(): ObjectID {
		return new ObjectID(this._str);
	}

	typeName(): 'oid' {
		return 'oid';
	}

	getTimestamp(): number {
		return Number.parseInt(this._str.substr(0, 8), 16);
	}

	valueOf(): string {
		return this._str;
	}

	toJSONValue(): string {
		return this.valueOf();
	}

	toHexString(): string {
		return this.valueOf();
	}

	static stringify(id: unknown): string {
		if (id instanceof ObjectID) {
			return id.valueOf();
		}
		if (typeof id === 'string') {
			const firstChar = id.charAt(0);
			if (id === '') {
				return id;
			}
			if (
				firstChar === '-' || // escape previously dashed strings
				firstChar === '~' || // escape escaped numbers, true, false
				_looksLikeObjectID(id) || // escape object-id-form strings
				firstChar === '{'
			) {
				return `-${id}`;
			}
			return id; // other strings go through unchanged.
		}
		if (id === undefined) {
			return '-';
		}
		if (typeof id === 'object' && id !== null) {
			throw new Error('Meteor does not currently support objects other than ObjectID as ids');
		}
		return `~${JSON.stringify(id)}`;
	}

	static parse(id: string): ObjectID | string | undefined {
		const firstChar = id.charAt(0);
		if (id === '') {
			return id;
		}
		if (id === '-') {
			return undefined;
		}
		if (firstChar === '-') {
			return id.slice(1);
		}
		if (firstChar === '~') {
			return JSON.parse(id.slice(1));
		}
		if (_looksLikeObjectID(id)) {
			return new ObjectID(id);
		}
		return id;
	}
}

EJSON.addType('oid', (str) => new ObjectID(str));

export const MongoID = {
	ObjectID,
	_looksLikeObjectID,
	idStringify: ObjectID.stringify,
	idParse: ObjectID.parse,
};
