import type { EncryptedPayload, GroupEnvelope, ByteArray } from '../types';

/* Pure serialization helpers (canonical, stable). Chosen JSON + base64 for simplicity; could be swapped. */

export function serializePayload(p: EncryptedPayload): ByteArray {
	const json = JSON.stringify({
		v: p.version,
		h: {
			e: toB64(p.header.ephemeralPub),
			pc: p.header.previousCounter,
			i: p.header.messageIndex,
		},
		c: toB64(p.ciphertext),
		a: p.associatedData ? toB64(p.associatedData) : undefined,
		mid: p.messageId,
		at: p.sentAt,
		sid: p.senderKeyId,
	});
	return new TextEncoder().encode(json);
}

export function deserializePayload(data: ByteArray): EncryptedPayload {
	const obj = JSON.parse(new TextDecoder().decode(data));
	return {
		version: obj.v,
		header: {
			ephemeralPub: fromB64(obj.h.e),
			previousCounter: obj.h.pc,
			messageIndex: obj.h.i,
		},
		ciphertext: fromB64(obj.c),
		associatedData: obj.a ? fromB64(obj.a) : undefined,
		messageId: obj.mid,
		sentAt: obj.at,
		senderKeyId: obj.sid,
	};
}

export function serializeGroupEnvelope(env: GroupEnvelope): ByteArray {
	const json = JSON.stringify({
		g: env.groupId,
		u: env.senderUserId,
		mv: env.membershipVersion,
		p: toB64(serializePayload(env.payload)),
	});
	return new TextEncoder().encode(json);
}

export function deserializeGroupEnvelope(data: ByteArray): GroupEnvelope {
	const obj = JSON.parse(new TextDecoder().decode(data));
	return {
		groupId: obj.g,
		senderUserId: obj.u,
		membershipVersion: obj.mv,
		payload: deserializePayload(fromB64(obj.p)),
	} as GroupEnvelope;
}

function toB64(b: ByteArray): string {
	return btoa(String.fromCharCode(...b));
}
function fromB64(s: string): ByteArray {
	return new Uint8Array(
		atob(s)
			.split('')
			.map((c) => c.charCodeAt(0)),
	);
}
