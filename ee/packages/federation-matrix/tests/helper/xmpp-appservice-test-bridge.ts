import { createHash } from 'node:crypto';

import { wait } from './synapse-client';

export type XmppAppserviceTestBridgeRoom = {
	alias: string;
	externalAlias: string;
	roomId: string;
	createdAt: string;
	members: string[];
};

export type XmppAppserviceTestBridgeTransaction = {
	txnId: string;
	receivedAt: string;
	body: {
		'events'?: Array<{
			event_id?: string;
			type?: string;
			sender?: string;
			room_id?: string;
			content?: Record<string, unknown>;
		}>;
		'ephemeral'?: unknown[];
		'de.sorunome.msc2409.ephemeral'?: unknown[];
	};
};

type WaitOptions = {
	maxRetries?: number;
	delay?: number;
};

type XmppAppserviceTestBridgeHealth = {
	ok: boolean;
	homeserverUrl: string;
	serverName: string;
	hsTokenHash: string;
	asTokenHash: string;
};

export const xmppAppserviceTestBridgeConfig = {
	url: process.env.FEDERATION_XMPP_BRIDGE_TEST_URL || 'http://localhost:3300',
	hsToken: process.env.FEDERATION_XMPP_BRIDGE_HS_TOKEN || 'xmpp_hs_token',
	asToken: process.env.FEDERATION_XMPP_BRIDGE_AS_TOKEN || 'xmpp_as_token',
};

type XmppAppserviceTestBridgeConnection = {
	client: XmppAppserviceTestBridgeClient;
};

type StartXmppAppserviceTestBridgeOptions = {
	baseUrl?: string;
	homeserverUrl: string;
	serverName: string;
	hsToken?: string;
	asToken?: string;
};

export function toXmppAppserviceLocalAlias(roomAlias: string): string {
	return roomAlias.startsWith('_xmpp_') ? roomAlias : `_xmpp_${roomAlias}`;
}

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
	const response = await fetch(url, {
		...options,
		headers: {
			...(options.body && { 'Content-Type': 'application/json' }),
			...options.headers,
		},
	});

	const raw = await response.text();
	const data = raw ? JSON.parse(raw) : {};

	if (!response.ok) {
		throw new Error(`XMPP appservice test bridge request failed with HTTP ${response.status}: ${raw}`);
	}

	return data as T;
}

export class XmppAppserviceTestBridgeClient {
	constructor(private readonly baseUrl = xmppAppserviceTestBridgeConfig.url) {}

	async health(): Promise<XmppAppserviceTestBridgeHealth> {
		return requestJson(`${this.baseUrl}/__health`);
	}

	async waitUntilReady({ maxRetries = 30, delay = 1000 }: WaitOptions = {}): Promise<void> {
		let lastError: unknown;
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				await this.health();
				return;
			} catch (error) {
				lastError = error;
				if (attempt < maxRetries) {
					await wait(delay);
				}
			}
		}

		throw lastError;
	}

	async reset(): Promise<void> {
		await requestJson(`${this.baseUrl}/__reset`, { method: 'POST' });
	}

	async getRooms(): Promise<XmppAppserviceTestBridgeRoom[]> {
		const result = await requestJson<{ rooms: XmppAppserviceTestBridgeRoom[] }>(`${this.baseUrl}/__rooms`);
		return result.rooms;
	}

	async getRoom(roomAlias: string): Promise<XmppAppserviceTestBridgeRoom | undefined> {
		const localAlias = toXmppAppserviceLocalAlias(roomAlias);
		const rooms = await this.getRooms();
		return rooms.find((room) => room.alias === localAlias);
	}

	async waitForRoom(roomAlias: string, { maxRetries = 10, delay = 1000 }: WaitOptions = {}): Promise<XmppAppserviceTestBridgeRoom> {
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			const room = await this.getRoom(roomAlias);
			if (room) {
				return room;
			}

			if (attempt < maxRetries) {
				await wait(delay);
			}
		}

		throw new Error(`XMPP appservice test bridge did not create room for alias ${roomAlias}`);
	}

	async getTransactions(): Promise<XmppAppserviceTestBridgeTransaction[]> {
		const result = await requestJson<{ transactions: XmppAppserviceTestBridgeTransaction[] }>(`${this.baseUrl}/__transactions`);
		return result.transactions;
	}

	async waitForTransaction(
		predicate: (transaction: XmppAppserviceTestBridgeTransaction) => boolean,
		{ maxRetries = 10, delay = 1000 }: WaitOptions = {},
	): Promise<XmppAppserviceTestBridgeTransaction> {
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			const match = (await this.getTransactions()).find(predicate);
			if (match) {
				return match;
			}

			if (attempt < maxRetries) {
				await wait(delay);
			}
		}

		throw new Error('XMPP appservice test bridge did not receive the expected transaction');
	}

	async sendMessage(
		roomAlias: string,
		message: { sender: string; body: string; displayName?: string },
	): Promise<{ eventId: string; roomId: string; userId: string; appserviceUserId: string }> {
		const localAlias = toXmppAppserviceLocalAlias(roomAlias);
		return requestJson(`${this.baseUrl}/__rooms/${encodeURIComponent(localAlias)}/messages`, {
			method: 'POST',
			body: JSON.stringify(message),
		});
	}

	async setRoomJoinFailure(roomAlias: string, options: { enabled?: boolean; statusCode?: number; error?: string } = {}): Promise<void> {
		const localAlias = toXmppAppserviceLocalAlias(roomAlias);
		await requestJson(`${this.baseUrl}/__rooms/${encodeURIComponent(localAlias)}/failure`, {
			method: 'POST',
			body: JSON.stringify(options),
		});
	}
}

function hashToken(value: string): string {
	return createHash('sha256').update(value).digest('hex');
}

function normalizeUrl(value: string): string {
	return value.replace(/\/+$/, '');
}

function assertBridgeConfigMatches({
	baseUrl,
	health,
	homeserverUrl,
	serverName,
	hsToken,
	asToken,
}: {
	baseUrl: string;
	health: XmppAppserviceTestBridgeHealth;
	homeserverUrl: string;
	serverName: string;
	hsToken: string;
	asToken: string;
}) {
	const mismatches = [
		normalizeUrl(health.homeserverUrl) === normalizeUrl(homeserverUrl) ? undefined : 'homeserverUrl',
		health.serverName === serverName ? undefined : 'serverName',
		health.hsTokenHash === hashToken(hsToken) ? undefined : 'hsToken',
		health.asTokenHash === hashToken(asToken) ? undefined : 'asToken',
	].filter(Boolean);

	if (mismatches.length === 0) {
		return;
	}

	throw new Error(
		`XMPP appservice test bridge at ${baseUrl} is already running with different config (${mismatches.join(
			', ',
		)}). Stop it or set FEDERATION_XMPP_BRIDGE_TEST_URL to another port.`,
	);
}

export async function ensureXmppAppserviceTestBridgeRunning({
	baseUrl = xmppAppserviceTestBridgeConfig.url,
	homeserverUrl,
	serverName,
	hsToken = xmppAppserviceTestBridgeConfig.hsToken,
	asToken = xmppAppserviceTestBridgeConfig.asToken,
}: StartXmppAppserviceTestBridgeOptions): Promise<XmppAppserviceTestBridgeConnection> {
	const client = new XmppAppserviceTestBridgeClient(baseUrl);
	await client.waitUntilReady({ maxRetries: 30, delay: 500 });
	const health = await client.health();

	assertBridgeConfigMatches({
		baseUrl,
		health,
		homeserverUrl,
		serverName,
		hsToken,
		asToken,
	});

	return {
		client,
	};
}
