import type { ProviderContext } from '../providers/interfaces';
import type { ByteArray, EncryptedPayload, DecryptionResult, RatchetStateSnapshot } from '../types';
import { DoubleRatchetEngine, type RatchetSession, type InitializeSessionParams } from '../core/doubleRatchet';
import { ProtocolError } from '../types';
import { SimpleReplayCache, deriveReplayId } from '../core/replayProtection';

export interface SessionConfig {
	peerId: string;
	replayProtection?: boolean;
}

export class SessionManager {
	private readonly ratchet: DoubleRatchetEngine;
	private readonly replay?: SimpleReplayCache;
	constructor(private readonly ctx: ProviderContext) {
		this.ratchet = new DoubleRatchetEngine(ctx);
	}

	enableReplayProtection(ttlMs?: number) {
		if (!this.replay) (this as any).replay = new SimpleReplayCache(ttlMs);
	}

	async createOrLoadPeerSession(peerId: string, init?: InitializeSessionParams): Promise<RatchetSession> {
		const existing = await this.ctx.storage.loadSessionState<RatchetStateSnapshot>(peerId);
		if (existing) {
			return { peerId, state: existing };
		}
		if (!init) throw new ProtocolError({ code: 'NO_INIT_PARAMS', message: 'Missing initialization params' });
		const session = await this.ratchet.initialize(peerId, init);
		await this.ctx.storage.storeSessionState(peerId, session.state);
		return session;
	}

	async encrypt(peerId: string, plaintext: ByteArray, ad?: ByteArray): Promise<EncryptedPayload> {
		const session = await this.createOrLoadPeerSession(peerId); // load existing
		const payload = await this.ratchet.encrypt(session, plaintext, ad);
		await this.ctx.storage.storeSessionState(peerId, session.state);
		return payload;
	}

	async decrypt(peerId: string, payload: EncryptedPayload, ad?: ByteArray): Promise<DecryptionResult> {
		const session = await this.createOrLoadPeerSession(peerId); // must exist
		const replayId = deriveReplayId(payload.messageId, payload.header);
		if (this.replay && this.replay.has(replayId)) {
			return { plaintext: new Uint8Array(), header: payload.header, messageId: payload.messageId, replay: true }; // caller decides
		}
		const result = await this.ratchet.decrypt(session, payload, ad);
		if (this.replay) this.replay.add(replayId);
		await this.ctx.storage.storeSessionState(peerId, session.state);
		return result;
	}
}
