/**
 * Minimal NTLM (NTLMv2 only) message construction/parsing for EWS service-account
 * authentication, implementing the subset of [MS-NLMP] needed for an HTTP handshake:
 * Type 1 (NEGOTIATE) -> Type 2 (CHALLENGE, from server) -> Type 3 (AUTHENTICATE).
 *
 * Vendored on purpose: the available npm NTLM packages are unmaintained, and this
 * keeps the wire behavior small and auditable (air-gapped deployments).
 */

import crypto from 'crypto';

import { md4 } from './md4';

const SIGNATURE = 'NTLMSSP\0';

const NEGOTIATE_UNICODE = 0x00000001;
const REQUEST_TARGET = 0x00000004;
const NEGOTIATE_NTLM = 0x00000200;
const NEGOTIATE_ALWAYS_SIGN = 0x00008000;
const NEGOTIATE_EXTENDED_SESSIONSECURITY = 0x00080000;

const TYPE1_FLAGS = NEGOTIATE_UNICODE | REQUEST_TARGET | NEGOTIATE_NTLM | NEGOTIATE_ALWAYS_SIGN | NEGOTIATE_EXTENDED_SESSIONSECURITY;

export interface INtlmCredentials {
	username: string;
	password: string;
	/** NETBIOS domain; parsed from DOMAIN\username when present */
	domain: string;
	workstation: string;
}

/** Splits `DOMAIN\user` service-account usernames; UPNs pass through with an empty domain */
export function parseNtlmUsername(raw: string): { username: string; domain: string } {
	const separator = raw.indexOf('\\');
	if (separator === -1) {
		return { username: raw, domain: '' };
	}
	return { domain: raw.slice(0, separator), username: raw.slice(separator + 1) };
}

export function createType1Message(): string {
	const header = Buffer.alloc(32);
	header.write(SIGNATURE, 0, 'ascii');
	header.writeUInt32LE(1, 8); // message type
	header.writeUInt32LE(TYPE1_FLAGS, 12);
	// Empty domain and workstation security buffers (offsets point past the header)
	header.writeUInt32LE(32, 16 + 4);
	header.writeUInt32LE(32, 24 + 4);
	return `NTLM ${header.toString('base64')}`;
}

export interface INtlmChallenge {
	serverChallenge: Buffer;
	targetInfo: Buffer;
	flags: number;
}

export function parseType2Message(authenticateHeader: string): INtlmChallenge {
	const match = /NTLM\s+([A-Za-z0-9+/=]+)/.exec(authenticateHeader);
	if (!match) {
		throw new Error('Server did not return an NTLM challenge');
	}

	const message = Buffer.from(match[1], 'base64');
	if (message.length < 48 || message.toString('ascii', 0, 8) !== SIGNATURE || message.readUInt32LE(8) !== 2) {
		throw new Error('Malformed NTLM Type 2 message');
	}

	const flags = message.readUInt32LE(20);
	const serverChallenge = Buffer.from(message.subarray(24, 32));

	const targetInfoLength = message.readUInt16LE(40);
	const targetInfoOffset = message.readUInt32LE(44);
	const targetInfo =
		targetInfoLength > 0 && targetInfoOffset + targetInfoLength <= message.length
			? Buffer.from(message.subarray(targetInfoOffset, targetInfoOffset + targetInfoLength))
			: Buffer.alloc(0);

	return { serverChallenge, targetInfo, flags };
}

/**
 * NTLMv2 compatibility primitive.
 * Per [MS-NLMP], NTLMv2 response construction requires HMAC-MD5.
 * Do not replace with a different digest unless NTLM authentication support is removed.
 */
function hmacMd5(key: Buffer, data: Buffer): Buffer {
	return crypto.createHmac('md5', key).update(data).digest();
}

/** NTOWFv2 ([MS-NLMP] 3.3.2): HMAC_MD5(MD4(UTF16LE(password)), UTF16LE(UPPER(user) + domain)) */
export function ntowfv2(username: string, password: string, domain: string): Buffer {
	// NTLMv2 requires MD4 here for NT hash derivation; this is protocol-defined legacy behavior.
	const passwordHash = md4(Buffer.from(password, 'utf16le'));
	return hmacMd5(passwordHash, Buffer.from(username.toUpperCase() + domain, 'utf16le'));
}

function unixToFiletime(unixMs: number): Buffer {
	const filetime = BigInt(unixMs + 11644473600000) * BigInt(10000);
	const buffer = Buffer.alloc(8);
	buffer.writeBigUInt64LE(filetime);
	return buffer;
}

export function createType3Message(
	challenge: INtlmChallenge,
	credentials: INtlmCredentials,
	options: { clientNonce?: Buffer; now?: number } = {},
): string {
	const clientNonce = options.clientNonce ?? crypto.randomBytes(8);
	const timestamp = unixToFiletime(options.now ?? Date.now());

	const responseKey = ntowfv2(credentials.username, credentials.password, credentials.domain);

	// NTLMv2 blob: version, timestamp, client nonce, and the server's target info echoed back
	const blob = Buffer.concat([
		Buffer.from([0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
		timestamp,
		clientNonce,
		Buffer.from([0x00, 0x00, 0x00, 0x00]),
		challenge.targetInfo,
		Buffer.from([0x00, 0x00, 0x00, 0x00]),
	]);

	const ntProof = hmacMd5(responseKey, Buffer.concat([challenge.serverChallenge, blob]));
	const ntResponse = Buffer.concat([ntProof, blob]);
	const lmResponse = Buffer.concat([hmacMd5(responseKey, Buffer.concat([challenge.serverChallenge, clientNonce])), clientNonce]);

	const domainBytes = Buffer.from(credentials.domain, 'utf16le');
	const usernameBytes = Buffer.from(credentials.username, 'utf16le');
	const workstationBytes = Buffer.from(credentials.workstation, 'utf16le');
	const sessionKeyBytes = Buffer.alloc(0);

	const headerLength = 64;
	const header = Buffer.alloc(headerLength);
	header.write(SIGNATURE, 0, 'ascii');
	header.writeUInt32LE(3, 8); // message type

	let offset = headerLength;
	const writeSecurityBuffer = (position: number, data: Buffer): void => {
		header.writeUInt16LE(data.length, position);
		header.writeUInt16LE(data.length, position + 2);
		header.writeUInt32LE(offset, position + 4);
		offset += data.length;
	};

	writeSecurityBuffer(12, lmResponse);
	writeSecurityBuffer(20, ntResponse);
	writeSecurityBuffer(28, domainBytes);
	writeSecurityBuffer(36, usernameBytes);
	writeSecurityBuffer(44, workstationBytes);
	writeSecurityBuffer(52, sessionKeyBytes);
	header.writeUInt32LE(TYPE1_FLAGS, 60);

	const message = Buffer.concat([header, lmResponse, ntResponse, domainBytes, usernameBytes, workstationBytes, sessionKeyBytes]);
	return `NTLM ${message.toString('base64')}`;
}
