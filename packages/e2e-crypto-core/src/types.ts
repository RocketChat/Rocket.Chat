/* Core shared types for the E2E crypto core */

export type ByteArray = Uint8Array; // explicit alias for clarity

export interface KeyMaterial {
	id: string; // stable identifier (e.g. KID / hash prefix)
	publicKey?: ByteArray; // raw public part when asymmetric
	secretKey?: ByteArray; // raw secret/symmetric key bytes (NEVER store here in production key store without encryption)
	algorithm: string; // e.g. 'X25519', 'Ed25519', 'AES-256-GCM'
	createdAt: number;
	expiresAt?: number;
	meta?: Record<string, unknown>;
}

export interface RatchetStateSnapshot {
	rootKey: ByteArray;
	sendChainKey: ByteArray;
	recvChainKey: ByteArray;
	sendIndex: number;
	recvIndex: number;
	theirEphemeralPub?: ByteArray;
	ourEphemeralKeyPair?: { pub: ByteArray; priv: ByteArray };
	previousCounter?: number; // for skipped message handling
	skippedMessageKeys?: Record<string, ByteArray>; // keyId -> key
	version: 1;
}

export interface EncryptedPayload {
	version: number; // protocol version
	header: RatchetHeader; // ratchet header
	ciphertext: ByteArray; // AEAD ciphertext (includes auth tag)
	associatedData?: ByteArray; // optional external AD used when encrypting
	messageId: string; // unique per message (nonce/uuid)
	sentAt: number; // epoch ms
	senderKeyId: string; // used for sender identity / verification
	digest?: ByteArray; // optional MAC/HMAC if layered
}

export interface RatchetHeader {
	ephemeralPub: ByteArray; // sender's current DH ratchet public key
	previousCounter: number; // number of messages in previous sending chain
	messageIndex: number; // index within current sending chain
}

export interface DecryptionResult {
	plaintext: ByteArray;
	header: RatchetHeader;
	messageId: string;
	replay: boolean; // true if rejected / duplicate would be flagged upstream
}

export interface GroupEnvelope {
	groupId: string;
	senderUserId: string;
	payload: EncryptedPayload;
	membershipVersion: number; // for group key state consistency
}

export interface KeyDerivationParams {
	salt: ByteArray;
	info?: ByteArray;
	iterations?: number;
	algorithm?: string; // e.g. 'HKDF-SHA256', 'PBKDF2-SHA256'
	length: number; // desired bytes
}

export interface ProtocolErrorDetails {
	code: string;
	message: string;
	cause?: unknown;
	context?: Record<string, unknown>;
}

export class ProtocolError extends Error {
	readonly code: string;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
	constructor(details: ProtocolErrorDetails) {
		super(details.message);
		this.code = details.code;
		this.cause = details.cause;
		this.context = details.context;
	}
}

export type IdentityKeyPair = { publicKey: ByteArray; privateKey: ByteArray; algorithm: string };
export type EphemeralKeyPair = { publicKey: ByteArray; privateKey: ByteArray; algorithm: string };

export interface SealedMessage {
	envelope: EncryptedPayload | GroupEnvelope;
	serialized: ByteArray; // canonical encoding output (provided by higher layer codec)
}
