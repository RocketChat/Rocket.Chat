import type { ServerMediaSignalNewCall } from '@rocket.chat/media-signaling';

import { stripSensitiveDataFromSignal } from './stripSensitiveData';

describe('stripSensitiveDataFromSignal', () => {
	it('drops TURN credentials from the ICE servers of a new call signal', () => {
		const signal: ServerMediaSignalNewCall = {
			type: 'new',
			callId: 'call-id',
			service: 'webrtc',
			kind: 'direct',
			role: 'callee',
			self: { type: 'user', id: 'callee-id' },
			contact: { type: 'user', id: 'caller-id' },
			iceServers: [{ urls: ['turn:turn.example.com:3478'], username: '1700003600:callee-id', credential: 'secret-derived' }],
		};

		expect(stripSensitiveDataFromSignal(signal).iceServers).toEqual([
			{ urls: ['turn:turn.example.com:3478'], username: '1700003600:callee-id' },
		]);
	});
});
