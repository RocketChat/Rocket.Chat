import { MeteorError } from '@rocket.chat/core-services';
import ejson from 'ejson';

import {
	SERVER_ID,
	SOCKJS_OPEN_FRAME,
	decode,
	encodeAdded,
	encodeChanged,
	encodeConnected,
	encodeNosub,
	encodePing,
	encodePong,
	encodeReady,
	encodeRemoved,
	encodeResult,
	encodeUpdated,
	preframe,
	wrapForSockJs,
} from './codec';

describe('decode', () => {
	it('parses an EJSON packet including extended values', () => {
		expect(decode(Buffer.from('{"msg":"method","id":"m1","method":"save","params":[{"$date":0}]}'), false)).toEqual({
			msg: 'method',
			id: 'm1',
			method: 'save',
			params: [new Date(0)],
		});
	});

	it('unwraps a SockJS array envelope and decodes only its first payload', () => {
		const data = JSON.stringify(['{"msg":"sub","id":"s1","name":"messages","params":[{"$date":0}]}', 'invalid ignored payload']);

		expect(decode(data, false)).toEqual({ msg: 'sub', id: 's1', name: 'messages', params: [new Date(0)] });
	});

	it('rejects binary messages with the Meteor error clients expect', () => {
		const decodeBinary = () => decode(Buffer.from('{"msg":"ping"}'), true);

		expect(decodeBinary).toThrow(MeteorError);
		expect(decodeBinary).toThrow(expect.objectContaining({ error: 500, reason: 'Binary data not supported' }));
	});

	it.each(['not JSON', '[', '[]', '["not JSON"]'])('rejects invalid payload %s', (payload) => {
		expect(() => decode(payload, false)).toThrow();
	});
});

describe('message encoders', () => {
	const meteorError = new MeteorError(403, 'Forbidden', { permission: 'view-room' });
	const plainError = Object.assign(new Error('non-enumerable message'), { code: 'transport-error' });

	it.each([
		['server id', SERVER_ID, { msg: 'server_id', server_id: '0' }],
		['connected', encodeConnected('session1'), { msg: 'connected', session: 'session1' }],
		['ping without id', encodePing(), { msg: 'ping' }],
		['ping with id', encodePing('p1'), { msg: 'ping', id: 'p1' }],
		['pong without id', encodePong(), { msg: 'pong' }],
		['pong with id', encodePong('p1'), { msg: 'pong', id: 'p1' }],
		['result with value', encodeResult('m1', { date: new Date(0) }), { msg: 'result', id: 'm1', result: { date: new Date(0) } }],
		['result without value', encodeResult('m1'), { msg: 'result', id: 'm1' }],
		['result with Meteor error', encodeResult('m1', undefined, meteorError), { msg: 'result', id: 'm1', error: meteorError.toJSON() }],
		['result with plain error', encodeResult('m1', undefined, plainError), { msg: 'result', id: 'm1', error: { code: 'transport-error' } }],
		['updated', encodeUpdated('m1'), { msg: 'updated', methods: ['m1'] }],
		['nosub without error', encodeNosub('s1'), { msg: 'nosub', id: 's1' }],
		['nosub with Meteor error', encodeNosub('s1', meteorError), { msg: 'nosub', id: 's1', error: meteorError.toJSON() }],
		['nosub with plain error', encodeNosub('s1', plainError), { msg: 'nosub', id: 's1', error: { code: 'transport-error' } }],
		['ready', encodeReady('s1'), { msg: 'ready', subs: ['s1'] }],
		[
			'added',
			encodeAdded('messages', 'message1', { text: 'hello', at: new Date(0) }),
			{ msg: 'added', collection: 'messages', id: 'message1', fields: { text: 'hello', at: new Date(0) } },
		],
		[
			'changed',
			encodeChanged('messages', 'message1', { text: 'updated' }),
			{ msg: 'changed', collection: 'messages', id: 'message1', fields: { text: 'updated' } },
		],
		['removed', encodeRemoved('messages', 'message1'), { msg: 'removed', collection: 'messages', id: 'message1' }],
	])('encodes %s as EJSON with DDP field names', (_name, encoded, expected) => {
		expect(ejson.parse(encoded)).toEqual(expected);
	});

	it('serializes the Meteor error in the session-safe shape', () => {
		expect(ejson.parse(encodeResult('m1', undefined, meteorError)).error).toEqual({
			isClientSafe: true,
			errorType: 'Meteor.Error',
			error: 403,
			reason: 'Forbidden',
			message: 'Forbidden [403]',
			details: { permission: 'view-room' },
		});
	});

	it('writes dates in EJSON form on the wire', () => {
		expect(JSON.parse(encodeResult('m1', { createdAt: new Date(0) }))).toEqual({
			msg: 'result',
			id: 'm1',
			result: { createdAt: { $date: 0 } },
		});
	});
});

describe('SockJS transport', () => {
	it('opens with the SockJS open frame', () => {
		expect(SOCKJS_OPEN_FRAME).toBe('o');
	});

	it('wraps a payload in a single-element SockJS array frame', () => {
		expect(wrapForSockJs('{"msg":"ping"}')).toBe('a["{\\"msg\\":\\"ping\\"}"]');
	});

	it('pre-frames a payload as one unmasked text frame per transport', () => {
		const payload = '{"msg":"ping"}';

		const { sockjs, raw } = preframe(payload);

		const [rawFrame] = raw;
		const [sockjsFrame] = sockjs;
		expect(raw).toHaveLength(1);
		expect(sockjs).toHaveLength(1);
		expect(rawFrame[0]).toBe(0x81);
		expect(rawFrame[1]).toBe(payload.length);
		expect(rawFrame.subarray(2).toString()).toBe(payload);
		expect(sockjsFrame[0]).toBe(0x81);
		expect(sockjsFrame.subarray(2).toString()).toBe(wrapForSockJs(payload));
	});
});
