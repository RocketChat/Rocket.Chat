import crypto from 'node:crypto';

export type RestClient = {
	get<T>(path: string): Promise<T>;
	post<T>(path: string, body: unknown): Promise<T>;
};

class RestError extends Error {
	constructor(
		readonly status: number,
		readonly body: string,
		path: string,
	) {
		super(`${path} → HTTP ${status}: ${body}`);
	}
}

/** Authenticates with RC_USER_ID/RC_AUTH_TOKEN, or logs in with RC_USER/RC_PASSWORD. */
export async function createRestClient(baseUrl: string): Promise<RestClient> {
	const request = async <T>(path: string, init: RequestInit, auth?: Record<string, string>): Promise<T> => {
		const res = await fetch(`${baseUrl}/api/v1/${path}`, {
			...init,
			headers: { 'Content-Type': 'application/json', ...auth, ...init.headers },
		});
		const text = await res.text();
		if (!res.ok) {
			throw new RestError(res.status, text, path);
		}
		return JSON.parse(text) as T;
	};

	let auth: Record<string, string>;
	if (process.env.RC_USER_ID && process.env.RC_AUTH_TOKEN) {
		auth = { 'X-User-Id': process.env.RC_USER_ID, 'X-Auth-Token': process.env.RC_AUTH_TOKEN };
	} else if (process.env.RC_USER && process.env.RC_PASSWORD) {
		const { data } = await request<{ data: { userId: string; authToken: string } }>('login', {
			method: 'POST',
			body: JSON.stringify({ user: process.env.RC_USER, password: process.env.RC_PASSWORD }),
		});
		auth = { 'X-User-Id': data.userId, 'X-Auth-Token': data.authToken };
	} else {
		throw new Error('Set RC_USER and RC_PASSWORD (or RC_USER_ID and RC_AUTH_TOKEN) for an admin account');
	}

	return {
		get: (path) => request(path, { method: 'GET' }, auth),
		post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }, auth),
	};
}

export type XMPPSetup = { domain: string; port: number; mucDomain: string; allowList: string[]; presenceEnabled: boolean };

const readSetting = async <T>(rest: RestClient, id: string): Promise<T> => (await rest.get<{ value: T }>(`settings/${id}`)).value;

/** Reads the server's XMPP configuration, enabling it first when asked to. */
export async function ensureXMPPEnabled(rest: RestClient, configure?: { domain: string; port: number }): Promise<XMPPSetup> {
	if (configure) {
		await rest.post('settings/XMPP_Server_Domain', { value: configure.domain });
		await rest.post('settings/XMPP_Server_Port', { value: configure.port });
		await rest.post('settings/XMPP_Server_Presence_Enabled', { value: true });
		await rest.post('settings/XMPP_Server_Enabled', { value: true });
	}

	const [enabled, domain, port, mucSubdomain, allowList, presenceEnabled] = await Promise.all([
		readSetting<boolean>(rest, 'XMPP_Server_Enabled'),
		readSetting<string>(rest, 'XMPP_Server_Domain'),
		readSetting<number>(rest, 'XMPP_Server_Port'),
		readSetting<string>(rest, 'XMPP_Server_MUC_Subdomain'),
		readSetting<string>(rest, 'XMPP_Server_Domain_Allow_List'),
		readSetting<boolean>(rest, 'XMPP_Server_Presence_Enabled'),
	]);
	if (!enabled || !domain) {
		throw new Error('The XMPP server is not enabled; pass --configure <domain> to enable it');
	}

	return {
		domain,
		port,
		mucDomain: `${mucSubdomain || 'conference'}.${domain}`,
		allowList: allowList
			.split(',')
			.map((entry) => entry.trim())
			.filter(Boolean),
		presenceEnabled,
	};
}

export const localUsername = (index: number): string => `lt-local-${index}`;

/** Creates the local recipients the scenarios address, skipping any that already exist. */
export async function ensureLocalUsers(rest: RestClient, count: number): Promise<string[]> {
	const usernames = Array.from({ length: count }, (_, i) => localUsername(i));
	for (const username of usernames) {
		try {
			await rest.get(`users.info?username=${encodeURIComponent(username)}`);
		} catch (error) {
			if (!(error instanceof RestError) || error.status !== 400) {
				throw error;
			}
			await rest.post('users.create', {
				username,
				name: username,
				email: `${username}@loadtest.invalid`,
				password: crypto.randomBytes(16).toString('hex'),
				verified: true,
			});
		}
	}
	return usernames;
}

/** Creates the public hosted MUC room the muc scenario posts into; returns its room JID. */
export async function ensureHostedRoom(rest: RestClient, name: string, members: string[]): Promise<string> {
	type ChannelResponse = { channel: { xmppFederation?: { role: string; muc?: string } } };

	let channel: ChannelResponse['channel'];
	try {
		({ channel } = await rest.get<ChannelResponse>(`channels.info?roomName=${encodeURIComponent(name)}`));
	} catch (error) {
		if (!(error instanceof RestError) || error.status !== 400) {
			throw error;
		}
		({ channel } = await rest.post<ChannelResponse>('channels.create', { name, members, extraData: { xmppFederated: true } }));
	}

	if (channel.xmppFederation?.role !== 'host-muc' || !channel.xmppFederation.muc) {
		throw new Error(`Channel "${name}" exists but is not a hosted XMPP room; delete it or pick another --room`);
	}
	return channel.xmppFederation.muc;
}
