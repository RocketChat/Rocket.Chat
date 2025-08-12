import type { ByteArray, EncryptedPayload } from '../types';
import type { ProviderContext } from '../providers/interfaces';

export class MessageIntegrity {
	constructor(private readonly ctx: ProviderContext) {}

	async computeMAC(payload: EncryptedPayload, macKey: ByteArray): Promise<ByteArray> {
		// Build canonical associated string
		const ad = new TextEncoder().encode(
			[payload.messageId, payload.sentAt.toString(), payload.senderKeyId, payload.header.messageIndex.toString()].join('|'),
		);
		return this.ctx.hash.hmac(macKey, ad, 'SHA-256');
	}

	async verifyMAC(payload: EncryptedPayload, macKey: ByteArray, mac: ByteArray): Promise<boolean> {
		const expected = await this.computeMAC(payload, macKey);
		return timingSafeEqual(expected, mac);
	}
}

function timingSafeEqual(a: ByteArray, b: ByteArray): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
	return diff === 0;
}
