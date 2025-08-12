import type { ProviderContext } from '../providers/interfaces';
import type { IdentityKeyPair, KeyMaterial, ByteArray } from '../types';
import { ProtocolError } from '../types';

export class KeyManager {
	constructor(private readonly ctx: ProviderContext) {}

	async ensureIdentityKey(): Promise<IdentityKeyPair> {
		const existing = await this.ctx.storage.loadIdentityKey();
		if (existing?.publicKey && existing.secretKey) {
			return { publicKey: existing.publicKey, privateKey: existing.secretKey, algorithm: existing.algorithm };
		}
		const kp = await this.ctx.crypto.generateEd25519KeyPair();
		const material: KeyMaterial = {
			id: 'identity',
			publicKey: kp.publicKey,
			secretKey: kp.privateKey,
			algorithm: 'Ed25519',
			createdAt: Date.now(),
		};
		await this.ctx.storage.storeIdentityKey(material);
		return { publicKey: kp.publicKey, privateKey: kp.privateKey, algorithm: 'Ed25519' };
	}

	async signPreKey(preKeyPub: ByteArray, identityPriv: ByteArray): Promise<ByteArray> {
		return this.ctx.crypto.ed25519Sign(identityPriv, preKeyPub);
	}

	async buildPreKeyBundle(): Promise<PreKeyBundleOut> {
		const identity = await this.ensureIdentityKey();
		const signedPre = await this.ctx.crypto.generateX25519KeyPair();
		const signature = await this.signPreKey(signedPre.publicKey, identity.privateKey);
		return {
			identityKey: identity.publicKey,
			signedPreKey: signedPre.publicKey,
			signedPreKeySignature: signature,
			oneTimePreKeys: [],
			timestamp: Date.now(),
		};
	}
}

export interface PreKeyBundleOut {
	identityKey: ByteArray;
	signedPreKey: ByteArray;
	signedPreKeySignature: ByteArray;
	oneTimePreKeys: ByteArray[];
	timestamp: number;
}

export class GroupKeyManager {
	constructor(private readonly ctx: ProviderContext) {}

	async deriveGroupKey(groupId: string, epoch: number): Promise<ByteArray> {
		const seed = await this.ctx.hash.hash(new TextEncoder().encode(`${groupId}:${epoch}`), 'SHA-256');
		const derived = await this.ctx.crypto.kdf(seed, new TextEncoder().encode('GROUP'));
		return derived.messageKey; // using messageKey part for actual symmetric key
	}

	async rotateGroupKey(groupId: string, nextEpoch: number): Promise<ByteArray> {
		const key = await this.deriveGroupKey(groupId, nextEpoch);
		await this.ctx.storage.storeGroupState(groupId, { epoch: nextEpoch, key });
		return key;
	}

	async currentGroupKey(groupId: string): Promise<{ epoch: number; key: ByteArray }> {
		const state = await this.ctx.storage.loadGroupState<{ epoch: number; key: ByteArray }>(groupId);
		if (!state) throw new ProtocolError({ code: 'NO_GROUP_KEY', message: 'Group key missing' });
		return state;
	}
}
