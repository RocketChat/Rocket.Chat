#!/usr/bin/env node
// Creates the users, rooms and login tokens every scenario needs, through the REST API, and writes them to a JSON file.
// Safe to run again: existing users and rooms are reused, and every user gets a fresh login token.
// usage: node seed.mjs --server http://localhost:3000 --out seed.json
import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { pool } from './lib/pool.mjs';
import { SEED } from './scenarios.mjs';

const { values: args } = parseArgs({
	options: {
		'server': { type: 'string', default: 'http://localhost:3000' },
		'out': { type: 'string' },
		'admin-user': { type: 'string', default: 'as-admin' },
		'admin-pass': { type: 'string', default: 'as-admin-pass' },
	},
});
if (!args.out) {
	throw new Error('--out is required');
}

const PASSWORD = 'as-viewer-pass-1';

const api = async (path, { auth, body, method = body ? 'POST' : 'GET' } = {}) => {
	const res = await fetch(`${args.server}/api/v1/${path}`, {
		method,
		headers: { 'Content-Type': 'application/json', ...(auth && { 'X-User-Id': auth.userId, 'X-Auth-Token': auth.token }) },
		body: body && JSON.stringify(body),
	});
	const json = await res.json();
	if (!res.ok || json.success === false) {
		throw Object.assign(new Error(`${path}: ${json.error ?? res.status}`), { json });
	}
	return json;
};

const login = async (user, password) => {
	const { data } = await api('login', { body: { user, password } });
	return { userId: data.userId, token: data.authToken };
};

const ensureUser = async (admin, username) => {
	try {
		await api('users.create', {
			auth: admin,
			body: {
				username,
				name: username,
				email: `${username}@example.com`,
				password: PASSWORD,
				verified: true,
				joinDefaultChannels: false,
				requirePasswordChange: false,
				sendWelcomeEmail: false,
			},
		});
	} catch (err) {
		if (!/already in use|exists/i.test(err.message + JSON.stringify(err.json ?? {}))) {
			throw err;
		}
	}
	return { username, ...(await login(username, PASSWORD)) };
};

const ensureChannel = async (admin, name, members) => {
	try {
		const { channel } = await api('channels.create', { auth: admin, body: { name, members } });
		return channel._id;
	} catch (err) {
		if (!/duplicate|already in use|exists/i.test(err.message + JSON.stringify(err.json ?? {}))) {
			throw err;
		}
		const { channel } = await api(`channels.info?roomName=${name}`, { auth: admin });
		return channel._id;
	}
};

const started = Date.now();
const admin = await login(args['admin-user'], args['admin-pass']);
const bot = await ensureUser(admin, 'as-bot');
const usernames = Array.from({ length: SEED.users }, (_, i) => `as-u${String(i).padStart(4, '0')}`);
const users = await pool(usernames, 16, (username) => ensureUser(admin, username));
console.log(`users ready in ${Date.now() - started} ms`);

const names = (from, count) => usernames.slice(from, from + count);
const rooms = {
	s1: await ensureChannel(admin, 'as-s1', [bot.username, ...names(0, 1)]),
	s2: await ensureChannel(admin, 'as-s2', [bot.username, ...names(0, SEED.s2Members)]),
	s4: await ensureChannel(admin, 'as-s4', [bot.username, ...names(0, SEED.s4Members)]),
	// group DMs of the bot and two viewers, as in DMs
	s3: await pool(
		Array.from({ length: SEED.s3Rooms }, (_, i) => i),
		8,
		async (i) => {
			const { room } = await api('dm.create', { auth: bot, body: { usernames: names(2 * i, 2).join(',') } });
			return room._id ?? room.rid;
		},
	),
};
console.log(`rooms ready in ${Date.now() - started} ms`);

writeFileSync(args.out, JSON.stringify({ server: args.server, createdAt: new Date().toISOString(), bot, users, rooms }, null, 2));
console.log(`wrote ${args.out}`);
