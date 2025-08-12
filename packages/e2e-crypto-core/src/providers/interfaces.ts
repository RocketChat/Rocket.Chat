import type { ByteArray, KeyMaterial, KeyDerivationParams } from '../types';

/* Sans-IO provider abstractions */

export interface RandomnessProvider {
	randomBytes(length: number): Promise<ByteArray>;
	uuidV4(): Promise<string>; // used for message IDs
}

export interface HashProvider {
	hash(data: ByteArray | string, algorithm: 'SHA-256' | 'SHA-512'): Promise<ByteArray>;
	hmac(key: ByteArray, data: ByteArray | string, algorithm: 'SHA-256' | 'SHA-512'): Promise<ByteArray>;
	hkdf?(ikm: ByteArray, params: KeyDerivationParams): Promise<ByteArray>; // optional specialized
	pbkdf2?(
		password: ByteArray,
		params: KeyDerivationParams & { iterations: number; algorithm: 'PBKDF2-SHA256' | 'PBKDF2-SHA512' },
	): Promise<ByteArray>;
}

export interface CryptoProvider {
	generateX25519KeyPair(): Promise<{ publicKey: ByteArray; privateKey: ByteArray }>;
	generateEd25519KeyPair(): Promise<{ publicKey: ByteArray; privateKey: ByteArray }>;
	generateSymmetricKey(length: 16 | 32): Promise<ByteArray>; // raw bytes (16=128, 32=256)
	diffieHellman(privateKey: ByteArray, publicKey: ByteArray): Promise<ByteArray>; // X25519
	ed25519Sign(privateKey: ByteArray, message: ByteArray): Promise<ByteArray>;
	ed25519Verify(publicKey: ByteArray, message: ByteArray, signature: ByteArray): Promise<boolean>;
	aeadEncrypt(
		key: ByteArray,
		nonce: ByteArray,
		plaintext: ByteArray,
		aad?: ByteArray,
		algorithm?: 'AES-256-GCM' | 'CHACHA20-POLY1305',
	): Promise<ByteArray>;
	aeadDecrypt(
		key: ByteArray,
		nonce: ByteArray,
		ciphertext: ByteArray,
		aad?: ByteArray,
		algorithm?: 'AES-256-GCM' | 'CHACHA20-POLY1305',
	): Promise<ByteArray>;
	kdf(chainKey: ByteArray, info: ByteArray): Promise<{ nextChainKey: ByteArray; messageKey: ByteArray }>;
}

export interface KeyStorageProvider {
	storeIdentityKey(key: KeyMaterial): Promise<void>;
	loadIdentityKey(): Promise<KeyMaterial | undefined>;
	storeSessionState(peerId: string, state: unknown): Promise<void>;
	loadSessionState<T = unknown>(peerId: string): Promise<T | undefined>;
	storeGroupState(groupId: string, state: unknown): Promise<void>;
	loadGroupState<T = unknown>(groupId: string): Promise<T | undefined>;
	listPeerSessions?(): Promise<string[]>; // optional introspection
}

export interface NetworkProvider {
	// All methods exchange opaque byte arrays / JSON-serializable records; no transport assumptions
	publishPreKeyBundle(bundle: PreKeyBundle): Promise<void>;
	fetchPreKeyBundle(peerId: string): Promise<PreKeyBundle | undefined>;
	submitGroupMessage(groupId: string, envelope: GroupNetworkEnvelope): Promise<void>;
	fetchGroupMessages(groupId: string, since?: number): Promise<GroupNetworkEnvelope[]>;
}

export interface PreKeyBundle {
	identityKey: ByteArray; // Ed25519 public
	signedPreKey: ByteArray; // X25519 public (signed)
	signedPreKeySignature: ByteArray; // Ed25519 signature
	oneTimePreKeys?: ByteArray[]; // optional X25519
	timestamp: number;
}

export interface GroupNetworkEnvelope {
	groupId: string;
	senderId: string;
	payload: ByteArray; // serialized GroupEnvelope
	sentAt: number;
}

export interface ProviderContext {
	crypto: CryptoProvider;
	rng: RandomnessProvider;
	hash: HashProvider;
	storage: KeyStorageProvider;
	net?: NetworkProvider; // optional if only local operations
}
