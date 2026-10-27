import { Emitter } from '@rocket.chat/emitter';

import { ClientMediaCall } from './Call';
import type { IClientMediaCallConfig } from './Call';
import type { MediaSignalTransportWrapper } from './TransportWrapper';
import type { IWebRTCProcessor, WebRTCProcessorConfig } from '../definition';
import type { ServerMediaSignalNewCall, ServerMediaSignalRejectedCallRequest } from '../definition/signals/server';

const SESSION_ID = 'session-id';

const makeTransporter = () =>
	({
		sendToServer: jest.fn(),
		hangup: jest.fn(),
		answer: jest.fn(),
		sendError: jest.fn(),
		requestRenegotiation: jest.fn(),
	}) as unknown as MediaSignalTransportWrapper;

const makeCall = (callId: string) => {
	const config: IClientMediaCallConfig = {
		userId: 'caller-id',
		sessionId: SESSION_ID,
		transporter: makeTransporter(),
		processorFactories: {},
		iceGatheringTimeout: 5000,
		iceServers: [],
		supportedFeatures: ['audio'],
	};

	return new ClientMediaCall(config, callId);
};

const rejection = (overrides: Partial<ServerMediaSignalRejectedCallRequest> = {}): ServerMediaSignalRejectedCallRequest => ({
	type: 'rejected-call-request',
	callId: 'call-id',
	toContractId: SESSION_ID,
	reason: 'forbidden',
	...overrides,
});

describe('ClientMediaCall', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.clearAllTimers();
		jest.useRealTimers();
	});

	describe('rejected-call-request', () => {
		it('ends the call', async () => {
			const call = makeCall('call-id');
			await call.initializeOutboundCall({ type: 'user', id: 'callee-id' });

			await call.processSignal(rejection());

			expect(call.state).toBe('hangup');
			expect(call.isOver()).toBe(true);
		});

		it('ends a call on a session that did not ask for it', async () => {
			// A call this session knows nothing about: the same signal reaches every
			// session the user has open, and the ones that did not place the call are hidden
			const call = makeCall('call-id');

			await call.processSignal(rejection());

			expect(call.hidden).toBe(true);
			expect(call.state).toBe('hangup');
		});

		it('ends a call on a session whose contract was not the one addressed', async () => {
			const call = makeCall('call-id');
			await call.initializeOutboundCall({ type: 'user', id: 'callee-id' });
			call.setContractState('ignored');

			await call.processSignal(rejection({ toContractId: 'some-other-session' }));

			expect(call.state).toBe('hangup');
		});
	});

	describe('ICE servers', () => {
		const configuredServer = { urls: 'stun:stun.example.com:3478' };
		const issuedServer = { urls: ['turn:turn.example.com:3478'], username: '1700003600:callee-id', credential: 'issued' };

		const makeCallWithWebRtc = () => {
			const webrtc = jest.fn((_config: WebRTCProcessorConfig) => ({ emitter: new Emitter() }) as unknown as IWebRTCProcessor);
			const call = new ClientMediaCall(
				{
					userId: 'callee-id',
					sessionId: SESSION_ID,
					transporter: makeTransporter(),
					processorFactories: { webrtc },
					iceGatheringTimeout: 5000,
					iceServers: [configuredServer],
					supportedFeatures: ['audio'],
				},
				'call-id',
			);

			return { call, webrtc };
		};

		const newCallSignal = (overrides: Partial<ServerMediaSignalNewCall> = {}): ServerMediaSignalNewCall => ({
			type: 'new',
			callId: 'call-id',
			service: 'webrtc',
			kind: 'direct',
			role: 'callee',
			self: { type: 'user', id: 'callee-id' },
			contact: { type: 'user', id: 'caller-id' },
			...overrides,
		});

		it('adds the servers issued on the new signal to the configured ones', async () => {
			const { call, webrtc } = makeCallWithWebRtc();

			await call.processSignal(newCallSignal({ iceServers: [issuedServer] }));

			expect(webrtc).toHaveBeenCalledWith(expect.objectContaining({ rtc: { iceServers: [configuredServer, issuedServer] } }));
		});

		it('uses only the configured servers when the new signal issues none', async () => {
			const { call, webrtc } = makeCallWithWebRtc();

			await call.processSignal(newCallSignal());

			expect(webrtc).toHaveBeenCalledWith(expect.objectContaining({ rtc: { iceServers: [configuredServer] } }));
		});
	});
});
