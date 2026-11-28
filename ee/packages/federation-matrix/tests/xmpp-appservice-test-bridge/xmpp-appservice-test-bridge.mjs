import crypto from 'node:crypto';
import http from 'node:http';
import https from 'node:https';

const port = Number.parseInt(process.env.PORT || '3300', 10);
const homeserverUrl = process.env.HOMESERVER_URL || 'http://rc1:3000';
const serverName = process.env.SERVER_NAME || 'rc1';
const hsToken = process.env.HS_TOKEN || 'xmpp_hs_token';
const asToken = process.env.AS_TOKEN || 'xmpp_as_token';

const roomsByAlias = new Map();
const roomCreationPromisesByAlias = new Map();
const transactions = [];
const registeredUsers = new Map();
const failingAliases = new Map();

function delay(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function readBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		req.on('data', (chunk) => chunks.push(chunk));
		req.on('end', () => {
			const raw = Buffer.concat(chunks).toString('utf8');
			if (!raw) {
				resolve({});
				return;
			}

			try {
				resolve(JSON.parse(raw));
			} catch (error) {
				reject(error);
			}
		});
		req.on('error', reject);
	});
}

function sendJson(res, statusCode, body = {}) {
	const payload = JSON.stringify(body);
	res.writeHead(statusCode, {
		'Content-Type': 'application/json',
		'Content-Length': Buffer.byteLength(payload),
	});
	res.end(payload);
}

function getBearerToken(req) {
	const auth = req.headers.authorization;
	if (typeof auth !== 'string') {
		return null;
	}

	const schemeEnd = auth.indexOf(' ');
	if (schemeEnd === -1) {
		return null;
	}

	const scheme = auth.slice(0, schemeEnd);
	if (scheme.toLowerCase() !== 'bearer') {
		return null;
	}

	const token = auth.slice(schemeEnd + 1).trimStart();
	return token || null;
}

function requireHomeserverToken(req, res) {
	if (getBearerToken(req) === hsToken) {
		return true;
	}

	sendJson(res, 401, {
		errcode: 'M_UNKNOWN_TOKEN',
		error: 'Invalid homeserver token',
	});
	return false;
}

function parseRoomAlias(roomAlias) {
	const match = roomAlias.match(/^#([^:]+):(.+)$/);
	if (!match) {
		throw new Error(`Invalid Matrix room alias: ${roomAlias}`);
	}

	const localAlias = match[1];
	const aliasServerName = match[2];
	if (!localAlias.startsWith('_xmpp_')) {
		throw new Error(`Room alias is outside the XMPP appservice namespace: ${roomAlias}`);
	}
	if (aliasServerName !== serverName) {
		throw new Error(`Room alias belongs to unexpected server ${aliasServerName}`);
	}

	return {
		localAlias,
		externalAlias: localAlias.slice('_xmpp_'.length),
	};
}

function xmppLocalpart(value) {
	const encoded = String(value).replace(/[^A-Za-z0-9._=-]/g, (character) => `=${character.charCodeAt(0).toString(16)}`);

	return `_xmpp_${encoded}`;
}

function buildUserId(localpart) {
	return `@${localpart}:${serverName}`;
}

function tokenHash(value) {
	return crypto.createHash('sha256').update(value).digest('hex');
}

function requestToHomeserver(method, path, body, { userId } = {}) {
	const url = new URL(path, homeserverUrl);
	if (userId) {
		url.searchParams.set('user_id', userId);
	}

	const payload = body === undefined ? undefined : JSON.stringify(body);
	const client = url.protocol === 'https:' ? https : http;

	return new Promise((resolve, reject) => {
		const req = client.request(
			url,
			{
				method,
				headers: {
					Authorization: `Bearer ${asToken}`,
					...(payload && {
						'Content-Type': 'application/json',
						'Content-Length': Buffer.byteLength(payload),
					}),
				},
			},
			(res) => {
				const chunks = [];
				res.on('data', (chunk) => chunks.push(chunk));
				res.on('end', () => {
					const raw = Buffer.concat(chunks).toString('utf8');
					let data = {};
					if (raw) {
						try {
							data = JSON.parse(raw);
						} catch {
							data = { raw };
						}
					}

					if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
						resolve(data);
						return;
					}

					const error = new Error(`Homeserver ${method} ${url.pathname} failed with HTTP ${res.statusCode}: ${raw || '<empty response>'}`);
					error.statusCode = res.statusCode;
					error.body = data;
					error.rawBody = raw;
					reject(error);
				});
			},
		);

		req.on('error', reject);
		if (payload) {
			req.write(payload);
		}
		req.end();
	});
}

async function createBridgeRoom(localAlias, externalAlias) {
	let result;
	let lastError;
	for (let attempt = 1; attempt <= 10; attempt++) {
		try {
			result = await requestToHomeserver('POST', '/_matrix/client/v3/createRoom', {
				room_alias_name: localAlias,
				name: localAlias,
				visibility: 'public',
				preset: 'public_chat',
				initial_state: [
					{
						type: 'm.room.join_rules',
						content: {
							join_rule: 'public',
						},
					},
				],
			});
			break;
		} catch (error) {
			lastError = error;
			if (attempt < 10) {
				await delay(500);
			}
		}
	}

	if (!result) {
		throw lastError || new Error(`Failed to create XMPP appservice test room for alias ${localAlias}`);
	}

	const room = {
		alias: localAlias,
		externalAlias,
		roomId: result.room_id,
		createdAt: new Date().toISOString(),
		members: [],
	};

	roomsByAlias.set(localAlias, room);
	return room;
}

async function ensureBridgeRoom(localAlias, externalAlias) {
	const existing = roomsByAlias.get(localAlias);
	if (existing) {
		return existing;
	}

	const pendingCreation = roomCreationPromisesByAlias.get(localAlias);
	if (pendingCreation) {
		return pendingCreation;
	}

	const creation = createBridgeRoom(localAlias, externalAlias);
	roomCreationPromisesByAlias.set(localAlias, creation);

	try {
		return await creation;
	} finally {
		roomCreationPromisesByAlias.delete(localAlias);
	}
}

function isUserAlreadyRegisteredError(error) {
	if (!(error instanceof Error)) {
		return false;
	}

	const errcode = error.body?.errcode;
	if (errcode === 'M_USER_IN_USE' || errcode === 'M_EXCLUSIVE') {
		return true;
	}

	return /already|exists|in use|taken/i.test(error.rawBody || error.message);
}

async function ensureXmppUser(xmppId) {
	const localpart = xmppLocalpart(xmppId);
	const appserviceUserId = buildUserId(localpart);
	const cachedUserId = registeredUsers.get(appserviceUserId);
	if (cachedUserId) {
		return { appserviceUserId, userId: cachedUserId };
	}

	let userId;
	try {
		const registration = await requestToHomeserver('POST', '/_matrix/client/v3/register', {
			type: 'm.login.application_service',
			username: localpart,
		});
		userId = registration.user_id;
	} catch (error) {
		if (!isUserAlreadyRegisteredError(error)) {
			throw error;
		}

		const identity = await requestToHomeserver('GET', '/_matrix/client/v3/account/whoami', undefined, {
			userId: appserviceUserId,
		});
		userId = identity.user_id;
	}

	if (typeof userId !== 'string' || !userId) {
		throw new Error(`Homeserver did not return a user_id while registering ${appserviceUserId}`);
	}

	registeredUsers.set(appserviceUserId, userId);
	return { appserviceUserId, userId };
}

async function updateXmppUserDisplayName(userId, displayName) {
	if (!displayName) {
		return;
	}

	await requestToHomeserver(
		'PUT',
		`/_matrix/client/v3/profile/${encodeURIComponent(userId)}/displayname`,
		{
			displayname: displayName,
		},
		{ userId },
	);
}

async function ensureUserJoined(room, userId) {
	if (room.members.includes(userId)) {
		return;
	}

	await requestToHomeserver('POST', `/_matrix/client/v3/join/${encodeURIComponent(room.roomId)}`, {}, { userId });
	room.members.push(userId);
}

async function sendXmppMessage(localAlias, sender, body, displayName) {
	const room = roomsByAlias.get(localAlias);
	if (!room) {
		throw new Error(`No XMPP appservice test room for alias ${localAlias}`);
	}

	const { appserviceUserId, userId } = await ensureXmppUser(sender);
	await updateXmppUserDisplayName(appserviceUserId, displayName);
	await ensureUserJoined(room, appserviceUserId);

	const result = await requestToHomeserver(
		'PUT',
		`/_matrix/client/v3/rooms/${encodeURIComponent(room.roomId)}/send/m.room.message/${crypto.randomUUID()}`,
		{
			msgtype: 'm.text',
			body,
		},
		{ userId: appserviceUserId },
	);

	return {
		eventId: result.event_id,
		roomId: room.roomId,
		userId,
		appserviceUserId,
	};
}

async function handleAppserviceRoomQuery(req, res, encodedAlias) {
	if (!requireHomeserverToken(req, res)) {
		return;
	}

	try {
		const roomAlias = decodeURIComponent(encodedAlias);
		const { localAlias, externalAlias } = parseRoomAlias(roomAlias);
		const failure = failingAliases.get(localAlias) || failingAliases.get(externalAlias);

		if (failure) {
			sendJson(res, failure.statusCode || 500, {
				errcode: 'M_UNKNOWN',
				error: failure.error || 'XMPP appservice test bridge rejected room alias',
			});
			return;
		}

		const room = await ensureBridgeRoom(localAlias, externalAlias);
		if (!room.roomId) {
			throw new Error(`Homeserver did not return a room ID for alias ${localAlias}`);
		}

		sendJson(res, 200, {});
	} catch (error) {
		sendJson(res, 500, {
			errcode: 'M_UNKNOWN',
			error: error instanceof Error ? error.message : 'Failed to handle room alias query',
		});
	}
}

async function handleTransaction(req, res, txnId) {
	if (!requireHomeserverToken(req, res)) {
		return;
	}

	const body = await readBody(req);
	transactions.push({
		txnId,
		receivedAt: new Date().toISOString(),
		body,
	});

	sendJson(res, 200, {});
}

async function handleTestMessage(req, res, localAlias) {
	const body = await readBody(req);
	if (!body.sender || !body.body) {
		sendJson(res, 400, {
			error: 'Expected JSON body with sender and body',
		});
		return;
	}

	try {
		const result = await sendXmppMessage(localAlias, body.sender, body.body, body.displayName);
		sendJson(res, 200, result);
	} catch (error) {
		sendJson(res, 500, {
			error: error instanceof Error ? error.message : 'Failed to send XMPP appservice test message',
		});
	}
}

async function handleTestFailure(req, res, localAlias) {
	const body = await readBody(req);
	if (body.enabled === false) {
		failingAliases.delete(localAlias);
		sendJson(res, 200, {});
		return;
	}

	failingAliases.set(localAlias, {
		statusCode: body.statusCode || 500,
		error: body.error || 'XMPP appservice test bridge rejected room alias',
	});
	sendJson(res, 200, {});
}

async function handleRequest(req, res) {
	const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
	const { pathname } = url;

	try {
		if (req.method === 'GET' && pathname === '/__health') {
			sendJson(res, 200, {
				ok: true,
				homeserverUrl,
				serverName,
				hsTokenHash: tokenHash(hsToken),
				asTokenHash: tokenHash(asToken),
			});
			return;
		}

		if (req.method === 'POST' && pathname === '/__reset') {
			roomsByAlias.clear();
			roomCreationPromisesByAlias.clear();
			transactions.splice(0);
			registeredUsers.clear();
			failingAliases.clear();
			sendJson(res, 200, {});
			return;
		}

		if (req.method === 'GET' && pathname === '/__rooms') {
			sendJson(res, 200, {
				rooms: Array.from(roomsByAlias.values()),
			});
			return;
		}

		if (req.method === 'GET' && pathname === '/__transactions') {
			sendJson(res, 200, {
				transactions,
			});
			return;
		}

		const testMessageMatch = pathname.match(/^\/__rooms\/([^/]+)\/messages$/);
		if (req.method === 'POST' && testMessageMatch) {
			await handleTestMessage(req, res, decodeURIComponent(testMessageMatch[1]));
			return;
		}

		const failureMatch = pathname.match(/^\/__rooms\/([^/]+)\/failure$/);
		if (req.method === 'POST' && failureMatch) {
			await handleTestFailure(req, res, decodeURIComponent(failureMatch[1]));
			return;
		}

		if (req.method === 'POST' && pathname === '/_matrix/app/v1/ping') {
			if (!requireHomeserverToken(req, res)) {
				return;
			}

			sendJson(res, 200, {});
			return;
		}

		const roomQueryMatch = pathname.match(/^\/_matrix\/app\/v1\/rooms\/(.+)$/);
		if (req.method === 'GET' && roomQueryMatch) {
			await handleAppserviceRoomQuery(req, res, roomQueryMatch[1]);
			return;
		}

		const userQueryMatch = pathname.match(/^\/_matrix\/app\/v1\/users\/(.+)$/);
		if (req.method === 'GET' && userQueryMatch) {
			if (!requireHomeserverToken(req, res)) {
				return;
			}

			sendJson(res, 200, {});
			return;
		}

		const transactionMatch = pathname.match(/^\/_matrix\/app\/v1\/transactions\/([^/]+)$/);
		if (req.method === 'PUT' && transactionMatch) {
			await handleTransaction(req, res, decodeURIComponent(transactionMatch[1]));
			return;
		}

		sendJson(res, 404, {
			error: 'Not found',
		});
	} catch (error) {
		sendJson(res, 500, {
			error: error instanceof Error ? error.message : 'Unexpected XMPP appservice test bridge error',
		});
	}
}

const server = http.createServer(handleRequest);

server.listen(port, '0.0.0.0', () => {
	console.log(`XMPP appservice test bridge listening on port ${port}`);
	console.log(`Homeserver URL: ${homeserverUrl}`);
	console.log(`Server name: ${serverName}`);
});
