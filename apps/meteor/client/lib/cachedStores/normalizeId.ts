/**
 * Converts a base64 encoded string into a lowercase hexadecimal string.
 */
const base64ToHex = (b64: string): string => {
	if (typeof Buffer !== 'undefined') {
		return Buffer.from(b64, 'base64').toString('hex');
	}
	if (typeof atob === 'function') {
		const raw = atob(b64);
		let hex = '';
		for (let i = 0; i < raw.length; i++) {
			hex += raw.charCodeAt(i).toString(16).padStart(2, '0');
		}
		return hex;
	}
	return b64;
};

/**
 * Normalizes a record identifier to a canonical string representation.
 *
 * Prevents duplicate entries in cached stores (such as sidebar rooms/subscriptions)
 * when an identifier is passed as a non-string (e.g. MongoDB ObjectId, Meteor Mongo.ObjectID,
 * or EJSON binary buffer payload).
 *
 * @param id - The identifier to normalize.
 * @returns A canonical string identifier.
 */
export const normalizeId = (id: unknown): string => {
	if (typeof id === 'string') {
		return id;
	}

	if (id === null || id === undefined) {
		return '';
	}

	if (typeof id === 'number' || typeof id === 'bigint') {
		return String(id);
	}

	if (typeof id === 'object') {
		// MongoDB / BSON ObjectId or Meteor Mongo.ObjectID
		if ('toHexString' in id && typeof (id as { toHexString: unknown }).toHexString === 'function') {
			return (id as { toHexString(): string }).toHexString();
		}

		// Meteor Mongo.ObjectID internal representation
		if ('_str' in id && typeof (id as { _str: unknown })._str === 'string') {
			return (id as { _str: string })._str;
		}

		// MongoDB Extended JSON representation of ObjectId
		if ('$oid' in id && typeof (id as { $oid: unknown }).$oid === 'string') {
			return (id as { $oid: string }).$oid;
		}

		// Raw Uint8Array / Buffer binary representation
		if (id instanceof Uint8Array) {
			return Array.from(id)
				.map((byte) => byte.toString(16).padStart(2, '0'))
				.join('');
		}

		// EJSON binary representation: { $binary: string | { base64: string } }
		// or { buffer: { $binary: ... } } as seen in Meteor DDP payloads
		const binary =
			('$binary' in id && (id as { $binary: unknown }).$binary) ||
			('buffer' in id &&
				id.buffer &&
				typeof id.buffer === 'object' &&
				'$binary' in id.buffer &&
				(id.buffer as { $binary: unknown }).$binary);

		if (typeof binary === 'string') {
			return base64ToHex(binary);
		}

		if (binary && typeof binary === 'object' && 'base64' in binary && typeof (binary as { base64: unknown }).base64 === 'string') {
			return base64ToHex((binary as { base64: string }).base64);
		}

		// Buffer as Uint8Array inside a wrapper object
		if ('buffer' in id && (id as { buffer: unknown }).buffer instanceof Uint8Array) {
			return Array.from((id as { buffer: Uint8Array }).buffer)
				.map((byte) => byte.toString(16).padStart(2, '0'))
				.join('');
		}

		if ('buffer' in id && (id as { buffer: unknown }).buffer instanceof ArrayBuffer) {
			return Array.from(new Uint8Array((id as { buffer: ArrayBuffer }).buffer))
				.map((byte) => byte.toString(16).padStart(2, '0'))
				.join('');
		}

		// Meteor EJSON custom type with toJSONValue
		if ('toJSONValue' in id && typeof (id as { toJSONValue: unknown }).toJSONValue === 'function') {
			const jsonVal = (id as { toJSONValue(): unknown }).toJSONValue();
			if (typeof jsonVal === 'string') {
				return jsonVal;
			}
			if (jsonVal && typeof jsonVal === 'object') {
				return normalizeId(jsonVal);
			}
		}

		if ('toString' in id && typeof (id as { toString: unknown }).toString === 'function') {
			const str = (id as { toString(): string }).toString();
			if (str && str !== '[object Object]') {
				return str;
			}
		}

		try {
			return JSON.stringify(id);
		} catch {
			return String(id);
		}
	}

	return String(id);
};
