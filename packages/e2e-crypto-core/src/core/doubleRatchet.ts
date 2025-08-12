import type { ByteArray, RatchetStateSnapshot, EncryptedPayload, RatchetHeader, DecryptionResult } from '../types';
import type { ProviderContext } from '../providers/interfaces';
import { ProtocolError } from '../types';

/* Minimal Double Ratchet skeleton (sans-IO). Focus: state transitions & KDF chaining. */

export interface InitializeSessionParams {
	theirIdentityKey: ByteArray;
	theirSignedPreKey: ByteArray;
	theirOneTimePreKey?: ByteArray;
	isInitiator: boolean;
}

export interface RatchetSession {
	peerId: string; // application-level peer identifier
	state: RatchetStateSnapshot;
}

const VERSION = 1;

export class DoubleRatchetEngine {
	constructor(private readonly ctx: ProviderContext) {}

	async initialize(peerId: string, params: InitializeSessionParams): Promise<RatchetSession> {
		// Generate our initial ephemeral
		const ourEphemeral = await this.ctx.crypto.generateX25519KeyPair();
		// Perform initial DHs (IK + SPK [+ OPK]) simplified to one combined secret for brevity
		const dh1 = await this.ctx.crypto.diffieHellman(ourEphemeral.privateKey, params.theirSignedPreKey);
		let combined = dh1;
		if (params.theirOneTimePreKey) {
			const dh2 = await this.ctx.crypto.diffieHellman(ourEphemeral.privateKey, params.theirOneTimePreKey);
			combined = concat(combined, dh2);
		}
		const rootKey = await this.deriveRootKey(combined);
		const chain = await this.ctx.crypto.kdf(rootKey, toBytes('INIT'));

		const snapshot: RatchetStateSnapshot = {
			rootKey: rootKey,
			sendChainKey: chain.nextChainKey,
			recvChainKey: chain.nextChainKey, // symmetric start; will separate after first ratchet step
			sendIndex: 0,
			recvIndex: 0,
			theirEphemeralPub: params.theirSignedPreKey, // placeholder
			ourEphemeralKeyPair: { pub: ourEphemeral.publicKey, priv: ourEphemeral.privateKey },
			previousCounter: 0,
			skippedMessageKeys: {},
			version: 1,
		};

		return { peerId, state: snapshot };
	}

	async encrypt(session: RatchetSession, plaintext: ByteArray, associatedData?: ByteArray): Promise<EncryptedPayload> {
		const { state } = session;
		const { messageKey, nextChainKey } = await this.ctx.crypto.kdf(state.sendChainKey, toBytes('MSG')); // message-level KDF
		state.sendChainKey = nextChainKey;
		const nonce = await this.ctx.rng.randomBytes(12);
		const ciphertext = await this.ctx.crypto.aeadEncrypt(messageKey, nonce, plaintext, associatedData, 'AES-256-GCM');

		const header: RatchetHeader = {
			ephemeralPub: state.ourEphemeralKeyPair!.pub,
			previousCounter: state.previousCounter ?? 0,
			messageIndex: state.sendIndex,
		};

		const payload: EncryptedPayload = {
			version: VERSION,
			header,
			ciphertext, // assumed to include auth tag (provider decides)
			associatedData,
			messageId: await this.ctx.rng.uuidV4(),
			sentAt: Date.now(),
			senderKeyId: toHex(state.ourEphemeralKeyPair!.pub).slice(0, 16),
		};

		state.sendIndex += 1;
		return payload;
	}

	async decrypt(session: RatchetSession, payload: EncryptedPayload, associatedData?: ByteArray): Promise<DecryptionResult> {
		const { state } = session;
		const header = payload.header;

		// For brevity skipping full skipped key / header checking logic
		const { messageKey, nextChainKey } = await this.ctx.crypto.kdf(state.recvChainKey, toBytes('MSG'));
		state.recvChainKey = nextChainKey;

		try {
			const plaintext = await this.ctx.crypto.aeadDecrypt(
				messageKey,
				payload.ciphertext.slice(0, 12),
				payload.ciphertext,
				associatedData,
				'AES-256-GCM',
			);
			state.recvIndex += 1;
			return { plaintext, header, messageId: payload.messageId, replay: false };
		} catch (e) {
			throw new ProtocolError({ code: 'DECRYPT_FAILED', message: 'Unable to decrypt message', cause: e });
		}
	}

	serializeState(session: RatchetSession): RatchetStateSnapshot {
		return session.state; // shallow (caller can deep copy if needed)
	}

	private async deriveRootKey(input: ByteArray): Promise<ByteArray> {
		const h = await this.ctx.hash.hash(input, 'SHA-256');
		return h; // simplistic; in production use HKDF chaining
	}
}

function concat(a: ByteArray, b: ByteArray): ByteArray {
	const out = new Uint8Array(a.length + b.length);
	out.set(a, 0);
	out.set(b, a.length);
	return out;
}

function toBytes(str: string): ByteArray {
	return new TextEncoder().encode(str);
}
function toHex(buf: ByteArray): string {
	return Array.from(buf)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}
