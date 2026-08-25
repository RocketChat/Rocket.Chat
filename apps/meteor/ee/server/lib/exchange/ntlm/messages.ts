/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Nico Haller
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Vendored from `@ewsjs/ntlm-client` (MIT, zero dependencies) and adapted. Vendored rather than depended
 * on because upstream has no way to pass channel bindings, and reaching that hook from outside would mean
 * mutating an undocumented internal structure.
 *
 * Changes from upstream:
 *
 * - Ported to TypeScript.
 * - `channelBindings` parameter added to the NTLMv2 response, which is the whole point.
 * - `new Buffer()` replaced with `Buffer.alloc` / `Buffer.from`.
 * - The client nonce now comes from `crypto.randomBytes` instead of `Math.random`, which is not a
 *   cryptographically secure source and should never have been used for one.
 * - MD4 comes from our own implementation, because Node's OpenSSL 3 no longer provides it.
 * - NTLMv1 paths dropped. Only NTLMv2 is reachable, since anything old enough to negotiate v1 is far
 *   outside what this project supports, and keeping DES-based code we never exercise is a liability.
 *
 */

import { createHmac, randomBytes } from 'crypto';

import { withChannelBindings } from './channelBinding';
import { md4 } from './md4';

const NTLM_SIGNATURE = 'NTLMSSP\0';

/** Only the flags we negotiate. Upstream carried the full table, most of it unused. */
export const NTLM_FLAGS = {
	NEGOTIATE_UNICODE: 1 << 0,
	NEGOTIATE_OEM: 1 << 1,
	REQUEST_TARGET: 1 << 2,
	NEGOTIATE_NTLM_KEY: 1 << 9,
	NEGOTIATE_DOMAIN_SUPPLIED: 1 << 12,
	NEGOTIATE_WORKSTATION_SUPPLIED: 1 << 13,
	NEGOTIATE_ALWAYS_SIGN: 1 << 15,
	NEGOTIATE_NTLM2_KEY: 1 << 19,
	NEGOTIATE_TARGET_INFO: 1 << 23,
	NEGOTIATE_128: 1 << 29,
	NEGOTIATE_56: 1 << 31,
} as const;

export type Type2Message = {
	flags: number;
	challenge: Buffer;
	targetName?: string;
	/** The raw AV_PAIR list. Channel bindings go in here before the blob is hashed. */
	targetInfo?: Buffer;
};

const TYPE1_FLAGS =
	NTLM_FLAGS.NEGOTIATE_UNICODE |
	NTLM_FLAGS.NEGOTIATE_OEM |
	NTLM_FLAGS.REQUEST_TARGET |
	NTLM_FLAGS.NEGOTIATE_NTLM_KEY |
	NTLM_FLAGS.NEGOTIATE_ALWAYS_SIGN |
	NTLM_FLAGS.NEGOTIATE_NTLM2_KEY;

export const createType1Message = (workstation = '', domain = ''): string => {
	const workstationBytes = Buffer.from(workstation.toUpperCase(), 'ascii');
	const domainBytes = Buffer.from(domain.toUpperCase(), 'ascii');

	let flags = TYPE1_FLAGS;
	if (domainBytes.length) {
		flags |= NTLM_FLAGS.NEGOTIATE_DOMAIN_SUPPLIED;
	}
	if (workstationBytes.length) {
		flags |= NTLM_FLAGS.NEGOTIATE_WORKSTATION_SUPPLIED;
	}

	const dataOffset = 32;
	const buf = Buffer.alloc(dataOffset + domainBytes.length + workstationBytes.length);

	buf.write(NTLM_SIGNATURE, 0, 'ascii');
	buf.writeUInt32LE(1, 8);
	buf.writeUInt32LE(flags, 12);

	buf.writeUInt16LE(domainBytes.length, 16);
	buf.writeUInt16LE(domainBytes.length, 18);
	buf.writeUInt32LE(dataOffset + workstationBytes.length, 20);

	buf.writeUInt16LE(workstationBytes.length, 24);
	buf.writeUInt16LE(workstationBytes.length, 26);
	buf.writeUInt32LE(dataOffset, 28);

	workstationBytes.copy(buf, dataOffset);
	domainBytes.copy(buf, dataOffset + workstationBytes.length);

	return `NTLM ${buf.toString('base64')}`;
};

export const decodeType2Message = (header: string): Type2Message => {
	const match = /(?:^|,\s*)NTLM\s+([A-Za-z0-9+/=]+)/i.exec(header);
	if (!match) {
		throw new Error('No NTLM challenge found in the WWW-Authenticate header');
	}

	const buf = Buffer.from(match[1], 'base64');

	if (buf.subarray(0, 8).toString('ascii') !== NTLM_SIGNATURE) {
		throw new Error('Invalid NTLM type 2 message: bad signature');
	}
	if (buf.readUInt32LE(8) !== 2) {
		throw new Error('Invalid NTLM type 2 message: not a type 2');
	}

	const flags = buf.readUInt32LE(20);
	const challenge = buf.subarray(24, 32);

	const targetNameLength = buf.readUInt16LE(12);
	const targetNameOffset = buf.readUInt32LE(16);
	const encoding = flags & NTLM_FLAGS.NEGOTIATE_UNICODE ? 'ucs2' : 'ascii';
	const targetName = targetNameLength ? buf.toString(encoding, targetNameOffset, targetNameOffset + targetNameLength) : undefined;

	let targetInfo: Buffer | undefined;
	if (flags & NTLM_FLAGS.NEGOTIATE_TARGET_INFO) {
		const length = buf.readUInt16LE(40);
		const offset = buf.readUInt32LE(44);

		if (offset + length > buf.length) {
			throw new Error('Invalid NTLM type 2 message: target info out of bounds');
		}

		targetInfo = Buffer.from(buf.subarray(offset, offset + length));
	}

	return { flags, challenge, targetName, targetInfo };
};

const createNtlmHash = (password: string): Buffer => md4(Buffer.from(password, 'ucs2'));

const createNtlmV2Hash = (ntlmHash: Buffer, username: string, target: string): Buffer =>
	createHmac('md5', ntlmHash)
		.update(Buffer.from(username.toUpperCase() + target, 'ucs2'))
		.digest();

/** Windows FILETIME: 100ns intervals since 1601, so the constant is the gap from the Unix epoch. */
const windowsTimestamp = (now: number): bigint => (BigInt(now) + BigInt(11644473600000)) * BigInt(10000);

const createLmV2Response = (type2: Type2Message, username: string, ntlmHash: Buffer, nonce: Buffer, target: string): Buffer => {
	const buf = Buffer.alloc(24);

	type2.challenge.copy(buf, 8);
	nonce.copy(buf, 16);

	createHmac('md5', createNtlmV2Hash(ntlmHash, username, target))
		.update(buf.subarray(8))
		.digest()
		.copy(buf);

	return buf;
};

/**
 * The one function that differs meaningfully from upstream.
 *
 * `channelBindings` goes into the target information block *before* the blob is hashed. That ordering is
 * the whole point: the AV_PAIR sits inside the hashed payload, so it cannot be appended afterwards, which
 * is why no library can bolt this on from outside.
 */
export const createNtlmV2Response = (
	type2: Type2Message,
	username: string,
	password: string,
	target: string,
	options: { nonce?: Buffer; now?: number; channelBindings?: Buffer } = {},
): Buffer => {
	const baseTargetInfo = type2.targetInfo ?? Buffer.alloc(4);
	const targetInfo = options.channelBindings ? withChannelBindings(baseTargetInfo, options.channelBindings) : baseTargetInfo;

	const nonce = options.nonce ?? randomBytes(8);
	const ntlmHash = createNtlmHash(password);
	const buf = Buffer.alloc(48 + targetInfo.length);

	// Bytes 0 to 15 end up holding the HMAC, written last, which overwrites the challenge placed at 8.
	type2.challenge.copy(buf, 8);
	buf.writeUInt32BE(0x01010000, 16); // blob signature
	buf.writeUInt32LE(0, 20); // reserved
	buf.writeBigUInt64LE(windowsTimestamp(options.now ?? Date.now()), 24);
	nonce.copy(buf, 32);
	buf.writeUInt32LE(0, 40); // reserved
	targetInfo.copy(buf, 44);
	buf.writeUInt32LE(0, 44 + targetInfo.length); // trailing padding

	createHmac('md5', createNtlmV2Hash(ntlmHash, username, target))
		.update(buf.subarray(8))
		.digest()
		.copy(buf);

	return buf;
};

export const createType3Message = (
	type2: Type2Message,
	username: string,
	password: string,
	workstation = '',
	domain?: string,
	options: { nonce?: Buffer; now?: number; channelBindings?: Buffer } = {},
): string => {
	const target = domain ?? type2.targetName ?? '';
	const nonce = options.nonce ?? randomBytes(8);
	const ntlmHash = createNtlmHash(password);

	const lmv2 = createLmV2Response(type2, username, ntlmHash, nonce, target);
	const ntlmv2 = createNtlmV2Response(type2, username, password, target, { ...options, nonce });

	const encoding = type2.flags & NTLM_FLAGS.NEGOTIATE_UNICODE ? 'ucs2' : 'ascii';
	const targetBytes = Buffer.from(target, encoding);
	const usernameBytes = Buffer.from(username, encoding);
	const workstationBytes = Buffer.from(workstation.toUpperCase(), encoding);

	const dataOffset = 64;
	const buf = Buffer.alloc(dataOffset + targetBytes.length + usernameBytes.length + workstationBytes.length + lmv2.length + ntlmv2.length);

	buf.write(NTLM_SIGNATURE, 0, 'ascii');
	buf.writeUInt32LE(3, 8);

	let offset = dataOffset;
	const writeSecurityBuffer = (payload: Buffer, headerOffset: number): void => {
		buf.writeUInt16LE(payload.length, headerOffset);
		buf.writeUInt16LE(payload.length, headerOffset + 2);
		buf.writeUInt32LE(offset, headerOffset + 4);
		payload.copy(buf, offset);
		offset += payload.length;
	};

	// Payload order is domain, user, workstation, LM, NTLM, but the header slots are in a different order.
	writeSecurityBuffer(targetBytes, 28);
	writeSecurityBuffer(usernameBytes, 36);
	writeSecurityBuffer(workstationBytes, 44);
	writeSecurityBuffer(lmv2, 12);
	writeSecurityBuffer(ntlmv2, 20);

	// Session key stays empty: we do not negotiate key exchange.
	buf.writeUInt16LE(0, 52);
	buf.writeUInt16LE(0, 54);
	buf.writeUInt32LE(offset, 56);

	buf.writeUInt32LE(type2.flags, 60);

	return `NTLM ${buf.toString('base64')}`;
};
