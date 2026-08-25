import { createHash } from 'crypto';

/**
 * Channel binding for Extended Protection, the `tls-server-end-point` variant of RFC 5929.
 *
 * No NTLM library implements this, and the reason is structural rather than an oversight: the value comes
 * from the TLS certificate of the connection, which lives in the socket, while the field it goes into
 * lives inside the NTLM message. Libraries keep those layers apart, so the feature falls in the gap.
 */

/** MS-NLMP AV_PAIR identifier for `MsvAvChannelBindings`. */
export const AV_ID_CHANNEL_BINDINGS = 0x000a;
/** MS-NLMP AV_PAIR identifier for `MsvAvEOL`, which terminates the list. */
export const AV_ID_EOL = 0x0000;

const CHANNEL_BINDING_PREFIX = 'tls-server-end-point:';

/** RFC 5929 4.1: the certificate's own signature hash, except MD5 and SHA-1 which upgrade to SHA-256. */
const SIGNATURE_OID_TO_HASH: Record<string, string> = {
	'1.2.840.113549.1.1.4': 'sha256', // md5WithRSA, upgraded per RFC 5929
	'1.2.840.113549.1.1.5': 'sha256', // sha1WithRSA, upgraded per RFC 5929
	'1.2.840.113549.1.1.11': 'sha256',
	'1.2.840.113549.1.1.12': 'sha384',
	'1.2.840.113549.1.1.13': 'sha512',
	'1.2.840.113549.1.1.10': 'sha256', // RSASSA-PSS, parameters not inspected
	'1.2.840.10045.4.3.2': 'sha256', // ecdsa-with-SHA256
	'1.2.840.10045.4.3.3': 'sha384',
	'1.2.840.10045.4.3.4': 'sha512',
};

const DEFAULT_HASH = 'sha256';

/** Returns the length and the offset of the content that follows it. */
const readDerLength = (der: Buffer, offset: number): { length: number; contentStart: number } => {
	const first = der[offset];

	if (first < 0x80) {
		return { length: first, contentStart: offset + 1 };
	}

	const byteCount = first & 0x7f;
	let length = 0;
	for (let i = 0; i < byteCount; i++) {
		length = length * 256 + der[offset + 1 + i];
	}

	return { length, contentStart: offset + 1 + byteCount };
};

const decodeOid = (bytes: Buffer): string => {
	const parts = [Math.floor(bytes[0] / 40), bytes[0] % 40];

	let value = 0;
	for (let i = 1; i < bytes.length; i++) {
		value = value * 128 + (bytes[i] & 0x7f);
		if ((bytes[i] & 0x80) === 0) {
			parts.push(value);
			value = 0;
		}
	}

	return parts.join('.');
};

/**
 * `Certificate ::= SEQUENCE { tbsCertificate, signatureAlgorithm, signatureValue }`, so this skips the
 * outer header and tbsCertificate, then reads the AlgorithmIdentifier's first OID.
 *
 * Falls back rather than throwing: a wrong guess is a diagnosable authentication failure, while throwing
 * would take down a sync over an unrecognised certificate.
 */
export const certificateHashAlgorithm = (der: Buffer): string => {
	try {
		if (der[0] !== 0x30) {
			return DEFAULT_HASH;
		}

		const outer = readDerLength(der, 1);

		const tbsStart = outer.contentStart;
		if (der[tbsStart] !== 0x30) {
			return DEFAULT_HASH;
		}
		const tbs = readDerLength(der, tbsStart + 1);

		const algStart = tbs.contentStart + tbs.length;
		if (der[algStart] !== 0x30) {
			return DEFAULT_HASH;
		}
		const alg = readDerLength(der, algStart + 1);

		if (der[alg.contentStart] !== 0x06) {
			return DEFAULT_HASH;
		}
		const oid = readDerLength(der, alg.contentStart + 1);
		const oidBytes = der.subarray(oid.contentStart, oid.contentStart + oid.length);

		return SIGNATURE_OID_TO_HASH[decodeOid(oidBytes)] ?? DEFAULT_HASH;
	} catch {
		return DEFAULT_HASH;
	}
};

/**
 * The address fields stay zeroed because `tls-server-end-point` binds to the certificate, not to network
 * addresses. MD5 of the resulting struct is the value MS-NLMP expects.
 */
export const computeChannelBindingHash = (certificateDer: Buffer): Buffer => {
	const algorithm = certificateHashAlgorithm(certificateDer);
	const certificateHash = createHash(algorithm).update(certificateDer).digest();

	const applicationData = Buffer.concat([Buffer.from(CHANNEL_BINDING_PREFIX, 'ascii'), certificateHash]);

	const struct = Buffer.alloc(20 + applicationData.length);
	struct.writeUInt32LE(applicationData.length, 16);
	applicationData.copy(struct, 20);

	return createHash('md5').update(struct).digest();
};

/** Placement matters: `MsvAvEOL` has to stay last, and the pair has to be inside the block before hashing. */
export const withChannelBindings = (targetInfo: Buffer, channelBindingHash: Buffer): Buffer => {
	const pair = Buffer.alloc(4 + channelBindingHash.length);
	pair.writeUInt16LE(AV_ID_CHANNEL_BINDINGS, 0);
	pair.writeUInt16LE(channelBindingHash.length, 2);
	channelBindingHash.copy(pair, 4);

	const eolOffset = findEolOffset(targetInfo);

	if (eolOffset === -1) {
		// Append a fresh terminator rather than corrupting the block.
		return Buffer.concat([targetInfo, pair, Buffer.alloc(4)]);
	}

	return Buffer.concat([targetInfo.subarray(0, eolOffset), pair, targetInfo.subarray(eolOffset)]);
};

/** Walks the list rather than assuming the terminator sits at the very end. */
const findEolOffset = (targetInfo: Buffer): number => {
	let offset = 0;

	while (offset + 4 <= targetInfo.length) {
		const id = targetInfo.readUInt16LE(offset);
		const length = targetInfo.readUInt16LE(offset + 2);

		if (id === AV_ID_EOL) {
			return offset;
		}

		offset += 4 + length;
	}

	return -1;
};
