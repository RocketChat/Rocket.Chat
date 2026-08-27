/* eslint-disable import/no-unresolved */
/* global __ENV, __VU, __ITER */

import { check, sleep } from 'k6';
import http from 'k6/http';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';
const ADMIN_USERNAME = __ENV.K6_ADMIN_USERNAME || 'rocketchat.internal.admin.test';
const ADMIN_PASSWORD = __ENV.K6_ADMIN_PASSWORD || ADMIN_USERNAME;

export const options = {
	vus: Number(__ENV.K6_VUS || 10),
	duration: __ENV.K6_DURATION || '30s',
	thresholds: {
		http_req_failed: ['rate<0.01'],
		http_req_duration: ['p(95)<1500'],
	},
};

function api(path) {
	return `${BASE_URL}/api/v1/${path}`;
}

function jsonHeaders(extra = {}) {
	return Object.assign({ 'Content-Type': 'application/json' }, extra);
}

function assertOkResponse(res, context) {
	// In k6, failed requests often come back with status=0 and body=null
	if (!res || res.error || res.status === 0 || res.body == null) {
		const err = res && res.error ? String(res.error) : 'unknown error';
		const status = res && typeof res.status === 'number' ? res.status : 'unknown status';
		throw new Error(`${context} failed (status=${status}, error=${err}, url=${res && res.url ? res.url : 'unknown url'})`);
	}
}

export function setup() {
	const loginRes = http.post(
		api('login'),
		JSON.stringify({
			user: ADMIN_USERNAME,
			password: ADMIN_PASSWORD,
		}),
		{ headers: jsonHeaders() },
	);

	assertOkResponse(loginRes, 'login request');

	check(loginRes, {
		'login status 200': (r) => r.status === 200,
		'login success true': (r) => r.body && r.json('status') === 'success',
	});

	if (loginRes.status !== 200 || (loginRes.body && loginRes.json('status') !== 'success')) {
		throw new Error(`login unexpected response (status=${loginRes.status}, body=${loginRes.body})`);
	}

	const authToken = loginRes.json('data.authToken');
	const userId = loginRes.json('data.userId');

	const authHeaders = jsonHeaders({
		'X-Auth-Token': authToken,
		'X-User-Id': userId,
	});

	const channelName = `k6-perf-${Date.now()}`;
	const createChannelRes = http.post(api('channels.create'), JSON.stringify({ name: channelName }), { headers: authHeaders });

	assertOkResponse(createChannelRes, 'channels.create request');

	check(createChannelRes, {
		'channels.create status 200': (r) => r.status === 200,
		'channels.create success true': (r) => r.body && r.json('success') === true,
	});

	if (createChannelRes.status !== 200 || (createChannelRes.body && createChannelRes.json('success') !== true)) {
		throw new Error(`channels.create unexpected response (status=${createChannelRes.status}, body=${createChannelRes.body})`);
	}

	const roomId = createChannelRes.json('channel._id');

	return { authToken, userId, channelName, roomId };
}

export default function (data) {
	const headers = jsonHeaders({
		'X-Auth-Token': data.authToken,
		'X-User-Id': data.userId,
	});

	const res = http.post(
		api('chat.postMessage'),
		JSON.stringify({
			channel: data.channelName,
			text: `k6 sendMessage ${__VU}-${__ITER} ${Date.now()}`,
		}),
		{ headers },
	);

	check(res, {
		'chat.postMessage status 200': (r) => r.status === 200,
		'chat.postMessage success true': (r) => r.json('success') === true,
	});

	sleep(0.1);
}

export function teardown(data) {
	const headers = jsonHeaders({
		'X-Auth-Token': data.authToken,
		'X-User-Id': data.userId,
	});

	// best-effort cleanup
	http.post(api('channels.delete'), JSON.stringify({ roomId: data.roomId }), { headers });
}
