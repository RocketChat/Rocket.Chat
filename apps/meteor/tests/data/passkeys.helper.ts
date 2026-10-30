import { createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto';

import type {
	AuthenticationResponseJSON,
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
	RegistrationResponseJSON,
} from '@simplewebauthn/server';

type CborValue = number | string | Buffer | Map<CborValue, CborValue>;

const cborHead = (majorType: number, length: number): Buffer => {
	if (length < 24) {
		return Buffer.from([(majorType << 5) | length]);
	}
	if (length < 0x100) {
		return Buffer.from([(majorType << 5) | 24, length]);
	}
	const head = Buffer.alloc(3);
	head[0] = (majorType << 5) | 25;
	head.writeUInt16BE(length, 1);
	return head;
};

const encodeCbor = (value: CborValue): Buffer => {
	if (typeof value === 'number') {
		return value >= 0 ? cborHead(0, value) : cborHead(1, -1 - value);
	}
	if (typeof value === 'string') {
		const bytes = Buffer.from(value, 'utf8');
		return Buffer.concat([cborHead(3, bytes.length), bytes]);
	}
	if (Buffer.isBuffer(value)) {
		return Buffer.concat([cborHead(2, value.length), value]);
	}
	return Buffer.concat([cborHead(5, value.size), ...[...value].flatMap(([key, entry]) => [encodeCbor(key), encodeCbor(entry)])]);
};

const sha256 = (data: Buffer | string): Buffer => createHash('sha256').update(data).digest();

const toBase64Url = (data: Buffer | string): string => Buffer.from(data).toString('base64url');

const FLAG_USER_PRESENT = 0x01;
const FLAG_USER_VERIFIED = 0x04;
const FLAG_BACKUP_ELIGIBLE = 0x08;
const FLAG_BACKED_UP = 0x10;
const FLAG_ATTESTED_CREDENTIAL_DATA = 0x40;

type CeremonyOverrides = {
	origin?: string;
	rpId?: string;
	userVerified?: boolean;
	/** Any JSON value: a forged response can claim anything as its challenge */
	challenge?: unknown;
	crossOrigin?: boolean;
};

/**
 * A passkey authenticator in software: an ES256 key pair that answers registration and sign-in ceremonies the way a
 * platform authenticator does, with `none` attestation.
 */
export class SoftwareAuthenticator {
	readonly credentialId = toBase64Url(randomBytes(32));

	private readonly keyPair = generateKeyPairSync('ec', { namedCurve: 'P-256' });

	private userHandle = toBase64Url(randomBytes(16));

	/** `undefined` reports a sign count of 0 on every use, as synced passkeys do */
	constructor(
		private readonly origin: string,
		private signCount?: number,
		private readonly backedUp = true,
	) {}

	createRegistrationResponse(options: PublicKeyCredentialCreationOptionsJSON, overrides: CeremonyOverrides = {}): RegistrationResponseJSON {
		this.userHandle = options.user.id;

		const jwk = this.keyPair.publicKey.export({ format: 'jwk' });
		const cosePublicKey = encodeCbor(
			new Map<CborValue, CborValue>([
				[1, 2],
				[3, -7],
				[-1, 1],
				[-2, Buffer.from(jwk.x as string, 'base64url')],
				[-3, Buffer.from(jwk.y as string, 'base64url')],
			]),
		);
		const credentialId = Buffer.from(this.credentialId, 'base64url');
		const credentialIdLength = Buffer.alloc(2);
		credentialIdLength.writeUInt16BE(credentialId.length);
		const attestedCredentialData = Buffer.concat([Buffer.alloc(16), credentialIdLength, credentialId, cosePublicKey]);

		const authenticatorData = Buffer.concat([
			this.createAuthenticatorData(overrides.rpId ?? options.rp.id ?? '', overrides.userVerified, FLAG_ATTESTED_CREDENTIAL_DATA),
			attestedCredentialData,
		]);
		const attestationObject = encodeCbor(
			new Map<CborValue, CborValue>([
				['fmt', 'none'],
				['attStmt', new Map()],
				['authData', authenticatorData],
			]),
		);

		return {
			id: this.credentialId,
			rawId: this.credentialId,
			type: 'public-key',
			clientExtensionResults: {},
			authenticatorAttachment: 'platform',
			response: {
				clientDataJSON: this.createClientDataJSON('webauthn.create', overrides.challenge ?? options.challenge, overrides),
				attestationObject: toBase64Url(attestationObject),
				transports: ['internal', 'hybrid'],
			},
		};
	}

	createAuthenticationResponse(
		options: PublicKeyCredentialRequestOptionsJSON,
		overrides: CeremonyOverrides & { userHandle?: string | null } = {},
	): AuthenticationResponseJSON {
		const authenticatorData = this.createAuthenticatorData(overrides.rpId ?? options.rpId ?? '', overrides.userVerified);
		const clientDataJSON = this.createClientDataJSON('webauthn.get', overrides.challenge ?? options.challenge, overrides);
		const signature = sign(
			'sha256',
			Buffer.concat([authenticatorData, sha256(Buffer.from(clientDataJSON, 'base64url'))]),
			this.keyPair.privateKey,
		);

		return {
			id: this.credentialId,
			rawId: this.credentialId,
			type: 'public-key',
			clientExtensionResults: {},
			authenticatorAttachment: 'platform',
			response: {
				clientDataJSON,
				authenticatorData: toBase64Url(authenticatorData),
				signature: toBase64Url(signature),
				...(overrides.userHandle !== null && { userHandle: overrides.userHandle ?? this.userHandle }),
			},
		};
	}

	/** Makes the next assertion report `signCount`, as a cloned authenticator would */
	rewindSignCount(signCount: number): void {
		this.signCount = signCount - 1;
	}

	private createAuthenticatorData(rpId: string, userVerified = true, extraFlags = 0): Buffer {
		if (this.signCount !== undefined) {
			this.signCount += 1;
		}
		const signCount = Buffer.alloc(4);
		signCount.writeUInt32BE(this.signCount ?? 0);

		const flags =
			FLAG_USER_PRESENT |
			(userVerified ? FLAG_USER_VERIFIED : 0) |
			(this.backedUp ? FLAG_BACKUP_ELIGIBLE | FLAG_BACKED_UP : 0) |
			extraFlags;

		return Buffer.concat([sha256(rpId), Buffer.from([flags]), signCount]);
	}

	private createClientDataJSON(
		type: 'webauthn.create' | 'webauthn.get',
		challenge: unknown,
		{ origin = this.origin, crossOrigin = false }: CeremonyOverrides,
	): string {
		return toBase64Url(JSON.stringify({ type, challenge, origin, crossOrigin }));
	}
}
