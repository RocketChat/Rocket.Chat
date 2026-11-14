/**
 * Normalizes a record _id into a canonical string.
 * Handles strings, BSON/Mongo ObjectIds, and DDP/EJSON binary buffer representations.
 * Returns empty string for unrecognized representations.
 */
export const normalizeId = (id: unknown): string => {
	if (typeof id === 'string') {
		return id;
	}

	if (id && typeof id === 'object') {
		// 1. BSON / Mongo ObjectId
		if ('toHexString' in id && typeof (id as { toHexString: () => unknown }).toHexString === 'function') {
			const hex = (id as { toHexString: () => unknown }).toHexString();
			if (typeof hex === 'string') {
				return hex;
			}
		}

		// 2. DDP/EJSON binary representation
		if ('buffer' in id) {
			const { buffer } = id;

			// Parsed EJSON representation: { buffer: Uint8Array }
			if (ArrayBuffer.isView(buffer)) {
				return Array.from(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength))
					.map((b) => b.toString(16).padStart(2, '0'))
					.join('');
			}

			// Raw DDP wire format: { buffer: { $binary: string } }
			if (buffer && typeof buffer === 'object' && '$binary' in buffer && typeof buffer.$binary === 'string') {
				const binary = atob(buffer.$binary);
				let hex = '';
				for (let i = 0; i < binary.length; i++) {
					hex += binary.charCodeAt(i).toString(16).padStart(2, '0');
				}
				return hex;
			}
		}
	}

	return '';
};
