import type { ByteArray } from '../types';

/* Stateless Bloom filter style interface would need storage; here we define a simple in-memory helper (sans-IO expects host to persist if desired). */

export interface ReplayCacheLike {
	has(id: string): boolean;
	add(id: string): void;
}

export class SimpleReplayCache implements ReplayCacheLike {
	private readonly window: Map<string, number> = new Map();
	private readonly ttlMs: number;
	constructor(ttlMs = 10 * 60 * 1000) {
		this.ttlMs = ttlMs;
	}
	has(id: string): boolean {
		this.sweep();
		return this.window.has(id);
	}
	add(id: string): void {
		this.sweep();
		this.window.set(id, Date.now());
	}
	private sweep(): void {
		const now = Date.now();
		for (const [k, v] of this.window.entries()) if (now - v > this.ttlMs) this.window.delete(k);
	}
}

export function deriveReplayId(messageId: string, header: { messageIndex: number; previousCounter: number }): string {
	return `${messageId}:${header.messageIndex}:${header.previousCounter}`;
}
