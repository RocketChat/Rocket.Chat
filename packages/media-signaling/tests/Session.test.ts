import { Emitter } from '@rocket.chat/emitter';

import type { IWebRTCProcessor, WebRTCInternalStateMap, WebRTCProcessorConfig, WebRTCProcessorEvents } from '../src/definition';
import type { ServiceStateValue } from '../src/definition/services/IServiceProcessor';
import type { ClientMediaSignal, ServerMediaSignal } from '../src/definition/signals';
import { MediaSignalingSession } from '../src/lib/Session';

class MockMediaStream {
	public getTracks() {
		return [];
	}
}

class MockedWebRTCProcessor implements IWebRTCProcessor {
	public readonly emitter: Emitter<WebRTCProcessorEvents>;

	public remoteMediaStream: MockMediaStream;

	public _muted = false;

	public get muted(): boolean {
		return this._muted;
	}

	public _held = false;

	public get held(): boolean {
		return this._held;
	}

	private stopped = false;

	private inputTrack: MediaStreamTrack | null = null;

	private mockStates: WebRTCInternalStateMap = {
		signaling: 'stable',
		connection: 'new',
		iceConnection: 'new',
		iceGathering: 'new',
		iceUntrickler: 'not-waiting',
	};

	constructor(private readonly config: WebRTCProcessorConfig) {
		this.remoteMediaStream = new MockMediaStream();
		this.inputTrack = config.inputTrack;
		this.emitter = new Emitter();
	}

	public getRemoteMediaStream() {
		return this.remoteMediaStream as unknown as MediaStream;
	}

	public async setInputTrack(newInputTrack: MediaStreamTrack | null): Promise<void> {
		this.config.logger?.debug('MockedWebRTCProcessor.setInputTrack');
		if (newInputTrack && newInputTrack.kind !== 'audio') {
			throw new Error('Unsupported track kind');
		}
		this.inputTrack = newInputTrack;
	}

	public async createOffer(_params: { iceRestart?: boolean }): Promise<{ sdp: RTCSessionDescriptionInit }> {
		this.config.logger?.debug('MockedWebRTCProcessor.createOffer');
		if (this.stopped) {
			throw new Error('WebRTC Processor has already been stopped.');
		}

		// Simulate state changes
		this.mockStates.signaling = 'have-local-offer';
		this.mockStates.iceGathering = 'gathering';
		this.emitter.emit('internalStateChange', 'signaling');
		this.emitter.emit('internalStateChange', 'iceGathering');

		// Simulate ICE gathering completion after a short delay
		setTimeout(() => {
			if (!this.stopped) {
				this.mockStates.iceGathering = 'complete';
				this.mockStates.iceUntrickler = 'not-waiting';
				this.emitter.emit('internalStateChange', 'iceGathering');
				this.emitter.emit('internalStateChange', 'iceUntrickler');
			}
		}, 10);

		// Return mock SDP
		return {
			sdp: {
				type: 'offer',
				sdp: `v=0\r\no=- ${Date.now()} 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:${Math.random().toString(36).substring(7)}\r\na=ice-pwd:${Math.random().toString(36).substring(7)}\r\na=fingerprint:sha-256 ${Math.random().toString(36).substring(7)}\r\na=setup:actpass\r\na=mid:0\r\na=sendrecv\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\n`,
			},
		};
	}

	public setMuted(muted: boolean): void {
		if (this.stopped) {
			return;
		}
		this._muted = muted;
		this.config.logger?.debug('MockedWebRTCProcessor.setMuted', muted);
	}

	public setHeld(held: boolean): void {
		if (this.stopped) {
			return;
		}
		this._held = held;
		this.config.logger?.debug('MockedWebRTCProcessor.setHeld', held);
	}

	public stop(): void {
		this.config.logger?.debug('MockedWebRTCProcessor.stop');
		this.stopped = true;
		// Stop the remote media stream
		// this.remoteMediaStream.getTracks().forEach((track) => track.stop());
	}

	public startNewNegotiation(): void {
		this.config.logger?.debug('MockedWebRTCProcessor.startNewNegotiation');
		this.mockStates.iceGathering = 'new';
		this.mockStates.iceUntrickler = 'not-waiting';
		this.emitter.emit('internalStateChange', 'iceGathering');
		this.emitter.emit('internalStateChange', 'iceUntrickler');
	}

	public async createAnswer({ sdp }: { sdp: RTCSessionDescriptionInit }): Promise<{ sdp: RTCSessionDescriptionInit }> {
		this.config.logger?.debug('MockedWebRTCProcessor.createAnswer');
		if (this.stopped) {
			throw new Error('WebRTC Processor has already been stopped.');
		}
		if (sdp.type !== 'offer') {
			throw new Error('invalid-webrtc-offer');
		}

		// Simulate state changes
		this.mockStates.signaling = 'have-remote-offer';
		this.mockStates.iceGathering = 'gathering';
		this.emitter.emit('internalStateChange', 'signaling');
		this.emitter.emit('internalStateChange', 'iceGathering');

		// Simulate ICE gathering completion after a short delay
		setTimeout(() => {
			if (!this.stopped) {
				this.mockStates.iceGathering = 'complete';
				this.mockStates.iceUntrickler = 'not-waiting';
				this.emitter.emit('internalStateChange', 'iceGathering');
				this.emitter.emit('internalStateChange', 'iceUntrickler');
			}
		}, 10);

		// Return mock SDP
		return {
			sdp: {
				type: 'answer',
				sdp: `v=0\r\no=- ${Date.now()} 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:${Math.random().toString(36).substring(7)}\r\na=ice-pwd:${Math.random().toString(36).substring(7)}\r\na=fingerprint:sha-256 ${Math.random().toString(36).substring(7)}\r\na=setup:active\r\na=mid:0\r\na=sendrecv\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\n`,
			},
		};
	}

	public async setRemoteAnswer({ sdp }: { sdp: RTCSessionDescriptionInit }): Promise<void> {
		this.config.logger?.debug('MockedWebRTCProcessor.setRemoteAnswer');
		if (this.stopped) {
			return;
		}

		if (sdp.type === 'offer') {
			throw new Error('invalid-answer');
		}

		// Simulate state change
		this.mockStates.signaling = 'stable';
		this.emitter.emit('internalStateChange', 'signaling');
	}

	public getInternalState<K extends keyof WebRTCInternalStateMap>(stateName: K): ServiceStateValue<WebRTCInternalStateMap, K> {
		return this.mockStates[stateName];
	}

	// Helper methods for testing
	public setMockState<K extends keyof WebRTCInternalStateMap>(stateName: K, value: WebRTCInternalStateMap[K]): void {
		this.mockStates[stateName] = value;
		this.emitter.emit('internalStateChange', stateName);
	}

	public emitNegotiationNeeded(): void {
		this.emitter.emit('negotiationNeeded');
	}

	public emitInternalError(error: { critical: boolean; error: string | Error }): void {
		this.emitter.emit('internalError', error);
	}

	public isStopped(): boolean {
		return this.stopped;
	}

	public getInputTrack(): MediaStreamTrack | null {
		return this.inputTrack;
	}
}

describe('media-signaling/Session', () => {
	it('should send a register signal when session is created', () => {
		const capturedSignals: ClientMediaSignal[] = [];
		const mockSessionId = 'test-session-id-register';

		const session = new MediaSignalingSession({
			userId: 'userId',
			processorFactories: {
				webrtc: (config) => new MockedWebRTCProcessor(config),
			},
			mediaStreamFactory: () => null as any,
			randomStringFactory: () => mockSessionId,
			transport: (signal) => {
				capturedSignals.push(signal);
			},
		});

		// Verify that a register signal was sent
		expect(capturedSignals).toHaveLength(1);

		const registerSignal = capturedSignals[0];
		expect(registerSignal).toMatchObject({
			contractId: mockSessionId,
			type: 'register',
		});

		// Verify session properties
		expect(session.sessionId).toBe(mockSessionId);
		expect(session.userId).toBe('userId');

		session.endSession();
	});

	it('should send a call request signal when startCall is called', async () => {
		let capturedSignals: ClientMediaSignal[] = [];
		const mockSessionId = 'test-session-id';
		const mockCallId = 'test-call-id';

		const session = new MediaSignalingSession({
			userId: 'userId',
			processorFactories: {
				webrtc: (config) => new MockedWebRTCProcessor(config),
			},
			mediaStreamFactory: () => null as any,
			randomStringFactory: () => mockSessionId,
			transport: (signal) => {
				capturedSignals.push(signal);
			},
		});

		expect(capturedSignals).toHaveLength(1);
		expect(capturedSignals[0].type).toBe('register');
		capturedSignals = [];

		// Mock the createTemporaryCallId method to return a predictable call ID
		(session as any).createTemporaryCallId = () => mockCallId;

		await session.startCall('user', 'userId2');

		// Verify that the signal was sent (request-call)
		expect(capturedSignals).toHaveLength(1);

		const callRequestSignal = capturedSignals[0];
		expect(callRequestSignal).toBeDefined();
		expect(callRequestSignal).toMatchObject({
			callId: mockCallId,
			contractId: mockSessionId,
			type: 'request-call',
			callee: {
				type: 'user',
				id: 'userId2',
			},
			supportedServices: ['webrtc'],
		});

		// Verify that the session has created a call
		const { knownCalls } = session as any;
		expect(knownCalls.has(mockCallId)).toBe(true);

		// Verify the call is properly initialized
		const call = knownCalls.get(mockCallId);
		expect(call).toBeDefined();
		expect(call.role).toBe('caller');
		expect(call.contact).toMatchObject({
			type: 'user',
			id: 'userId2',
		});

		session.endSession();
	});

	it('should emit newCall event when call is initialized', async () => {
		const capturedSignals: ClientMediaSignal[] = [];
		const mockSessionId = 'test-session-id-3';
		const mockCallId = 'test-call-id-3';
		const newCallEvents: any[] = [];

		const session = new MediaSignalingSession({
			userId: 'userId',
			processorFactories: {
				webrtc: (config) => new MockedWebRTCProcessor(config),
			},
			mediaStreamFactory: () => null as any,
			randomStringFactory: () => mockSessionId,
			transport: (signal) => {
				capturedSignals.push(signal);
			},
		});

		// Listen for newCall events
		session.on('newCall', (event) => {
			newCallEvents.push(event);
		});

		// Mock the createTemporaryCallId method
		(session as any).createTemporaryCallId = () => mockCallId;

		await session.startCall('user', 'userId2');

		// Verify that newCall event was emitted
		expect(newCallEvents).toHaveLength(1);
		expect(newCallEvents[0]).toHaveProperty('call');
		expect(newCallEvents[0].call.callId).toBe(mockCallId);

		session.endSession();
	});

	it('should handle a whole call as a callee', async () => {
		let capturedSignals: ClientMediaSignal[] = [];
		const mockSessionId = 'test-session-id-incoming';
		const newCallEvents: any[] = [];
		const endedCallEvents: any[] = [];
		const acceptedCallEvents: any[] = [];

		const session = new MediaSignalingSession({
			userId: 'userId',
			processorFactories: {
				webrtc: (config) => new MockedWebRTCProcessor(config),
			},
			mediaStreamFactory: () => null as any,
			randomStringFactory: () => mockSessionId,
			transport: (signal) => {
				capturedSignals.push(signal);
			},
		});

		// Listen for events
		session.on('newCall', (event) => {
			newCallEvents.push(event);
		});
		session.on('acceptedCall', (event) => {
			acceptedCallEvents.push(event);
		});
		session.on('endedCall', () => {
			endedCallEvents.push(null);
		});

		// Create a mock incoming call signal
		const incomingCallSignal: ServerMediaSignal = {
			callId: 'incoming-call-id',
			type: 'new',
			service: 'webrtc',
			kind: 'direct',
			role: 'callee',
			self: {
				type: 'user',
				id: 'userId',
				contractId: mockSessionId,
				displayName: 'Current User',
			},
			contact: {
				type: 'user',
				id: 'caller-user-id',
				displayName: 'Caller User',
			},
		};

		capturedSignals = [];

		// Process the incoming signal
		await session.processSignal(incomingCallSignal);

		// Verify that a new call was created and newCall event was emitted
		expect(newCallEvents).toHaveLength(1);
		expect(newCallEvents[0]).toHaveProperty('call');

		const { call } = newCallEvents[0];
		expect(call.callId).toBe('incoming-call-id');
		expect(call.role).toBe('callee');
		expect(call.service).toBe('webrtc');
		expect(call.contact).toMatchObject({
			type: 'user',
			id: 'caller-user-id',
			displayName: 'Caller User',
		});

		// Verify the call is in the known calls map
		const { knownCalls } = session as any;
		expect(knownCalls.has('incoming-call-id')).toBe(true);

		// Verify no accepted call events yet (call hasn't been accepted)
		expect(acceptedCallEvents).toHaveLength(0);

		// Verify that ack signal was sent
		const answerSignals = capturedSignals.filter((signal) => signal.type === 'answer');
		expect(answerSignals).toHaveLength(1);

		const ackSignal = answerSignals.find((signal) => signal.answer === 'ack');
		expect(ackSignal).toBeDefined();

		expect(ackSignal).toMatchObject({
			callId: 'incoming-call-id',
			contractId: mockSessionId,
			type: 'answer',
			answer: 'ack',
		});

		capturedSignals = [];

		// Test accepting the call
		call.accept();

		// Verify that answer signals were sent (ack + accept)
		const newAnswerSignals = capturedSignals.filter((signal) => signal.type === 'answer');
		expect(newAnswerSignals).toHaveLength(1);

		// Check that we have both ack and accept signals
		const acceptSignal = newAnswerSignals.find((signal) => signal.answer === 'accept');

		expect(acceptSignal).toBeDefined();

		expect(acceptSignal).toMatchObject({
			callId: 'incoming-call-id',
			contractId: mockSessionId,
			type: 'answer',
			answer: 'accept',
		});

		const acceptNotificationSignal: ServerMediaSignal = {
			callId: 'incoming-call-id',
			type: 'notification',
			notification: 'accepted',
			signedContractId: mockSessionId,
		};

		expect(acceptedCallEvents).toHaveLength(0);
		await session.processSignal(acceptNotificationSignal);
		expect(acceptedCallEvents).toHaveLength(1);

		capturedSignals = [];
		const offerSignal: ServerMediaSignal = {
			callId: 'incoming-call-id',
			type: 'remote-sdp',
			toContractId: mockSessionId,
			negotiationId: 'negotiationId',
			sdp: {
				type: 'offer',
				sdp: `v=0\r\no=- ${Date.now()} 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:${Math.random().toString(36).substring(7)}\r\na=ice-pwd:${Math.random().toString(36).substring(7)}\r\na=fingerprint:sha-256 ${Math.random().toString(36).substring(7)}\r\na=setup:actpass\r\na=mid:0\r\na=sendrecv\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\n`,
			},
		};
		await session.processSignal(offerSignal);

		const localSdpSignals = capturedSignals.filter((signal) => signal.type === 'local-sdp');
		expect(localSdpSignals).toHaveLength(1);

		const hangupSignal: ServerMediaSignal = {
			callId: 'incoming-call-id',
			type: 'notification',
			notification: 'hangup',
		};

		expect(endedCallEvents).toHaveLength(0);
		await session.processSignal(hangupSignal);
		expect(endedCallEvents).toHaveLength(1);

		session.endSession();
	});

	it('should handle a whole call as a caller', async () => {
		let capturedSignals: ClientMediaSignal[] = [];
		const mockSessionId = 'test-session-id-caller';
		const mockCallId = 'test-call-id-caller';
		const newCallEvents: any[] = [];
		const acceptedCallEvents: any[] = [];
		const endedCallEvents: any[] = [];

		const session = new MediaSignalingSession({
			userId: 'userId',
			processorFactories: {
				webrtc: (config) => new MockedWebRTCProcessor(config),
			},
			mediaStreamFactory: () => null as any,
			randomStringFactory: () => mockSessionId,
			transport: (signal) => {
				capturedSignals.push(signal);
			},
		});

		// Listen for events
		session.on('newCall', (event) => {
			newCallEvents.push(event);
		});
		session.on('acceptedCall', (event) => {
			acceptedCallEvents.push(event);
		});
		session.on('endedCall', () => {
			endedCallEvents.push(null);
		});

		// Clear register signal
		expect(capturedSignals).toHaveLength(1);
		expect(capturedSignals[0].type).toBe('register');
		capturedSignals = [];

		// Mock the createTemporaryCallId method
		(session as any).createTemporaryCallId = () => mockCallId;

		// Start the call
		await session.startCall('user', 'callee-user-id');

		// Verify that the call request signal was sent
		expect(capturedSignals).toHaveLength(1);
		const callRequestSignal = capturedSignals[0];
		expect(callRequestSignal).toMatchObject({
			callId: mockCallId,
			contractId: mockSessionId,
			type: 'request-call',
			callee: {
				type: 'user',
				id: 'callee-user-id',
			},
			supportedServices: ['webrtc'],
		});

		// Verify that a new call was created and newCall event was emitted
		expect(newCallEvents).toHaveLength(1);
		expect(newCallEvents[0]).toHaveProperty('call');

		const { call } = newCallEvents[0];
		expect(call.callId).toBe(mockCallId);
		expect(call.role).toBe('caller');
		expect(call.service).toBe(null); // Service is null until remote data is received
		expect(call.contact).toMatchObject({
			type: 'user',
			id: 'callee-user-id',
		});

		// Verify the call is in the known calls map
		const { knownCalls } = session as any;
		expect(knownCalls.has(mockCallId)).toBe(true);

		// Verify no accepted call events yet (call hasn't been accepted)
		expect(acceptedCallEvents).toHaveLength(0);

		capturedSignals = [];

		// Simulate receiving a "new" signal from the server (call acknowledged)
		const newCallSignal: ServerMediaSignal = {
			callId: 'server-call-id',
			type: 'new',
			service: 'webrtc',
			kind: 'direct',
			role: 'caller',
			self: {
				type: 'user',
				id: 'userId',
				contractId: mockSessionId,
				displayName: 'Current User',
			},
			contact: {
				type: 'user',
				id: 'callee-user-id',
				displayName: 'Callee User',
			},
			requestedCallId: mockCallId,
		};

		await session.processSignal(newCallSignal);

		// Verify that the service is now set after receiving remote data
		expect(call.service).toBe('webrtc');

		// Verify that an ack signal was sent
		const ackSignals = capturedSignals.filter((signal) => signal.type === 'answer');
		expect(ackSignals).toHaveLength(1);

		const ackSignal = ackSignals.find((signal) => signal.answer === 'ack');
		expect(ackSignal).toBeDefined();
		expect(ackSignal).toMatchObject({
			callId: 'server-call-id',
			contractId: mockSessionId,
			type: 'answer',
			answer: 'ack',
		});

		capturedSignals = [];

		// Simulate receiving an acceptance notification
		const acceptNotificationSignal: ServerMediaSignal = {
			callId: 'server-call-id',
			type: 'notification',
			notification: 'accepted',
			signedContractId: mockSessionId,
		};

		expect(acceptedCallEvents).toHaveLength(0);
		await session.processSignal(acceptNotificationSignal);
		expect(acceptedCallEvents).toHaveLength(1);

		capturedSignals = [];

		// Simulate receiving a request-offer signal (callee wants us to create an offer)
		const requestOfferSignal: ServerMediaSignal = {
			callId: 'server-call-id',
			type: 'request-offer',
			negotiationId: 'negotiation-id-1',
			toContractId: mockSessionId,
		};

		await session.processSignal(requestOfferSignal);

		// Verify that a local-sdp signal was sent (our offer)
		const localSdpSignals = capturedSignals.filter((signal) => signal.type === 'local-sdp');
		expect(localSdpSignals).toHaveLength(1);

		const localSdpSignal = localSdpSignals[0];
		expect(localSdpSignal).toMatchObject({
			callId: 'server-call-id',
			contractId: mockSessionId,
			type: 'local-sdp',
			negotiationId: 'negotiation-id-1',
		});
		expect(localSdpSignal.sdp).toBeDefined();
		expect(localSdpSignal.sdp.type).toBe('offer');

		capturedSignals = [];

		// Simulate receiving the callee's answer
		const remoteSdpSignal: ServerMediaSignal = {
			callId: 'server-call-id',
			type: 'remote-sdp',
			toContractId: mockSessionId,
			negotiationId: 'negotiation-id-1',
			sdp: {
				type: 'answer',
				sdp: `v=0\r\no=- ${Date.now()} 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:${Math.random().toString(36).substring(7)}\r\na=ice-pwd:${Math.random().toString(36).substring(7)}\r\na=fingerprint:sha-256 ${Math.random().toString(36).substring(7)}\r\na=setup:active\r\na=mid:0\r\na=sendrecv\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\n`,
			},
		};

		await session.processSignal(remoteSdpSignal);

		// No additional signals should be sent when receiving the answer
		expect(capturedSignals).toHaveLength(0);

		// Simulate call ending (hangup notification)
		const hangupSignal: ServerMediaSignal = {
			callId: 'server-call-id',
			type: 'notification',
			notification: 'hangup',
		};

		expect(endedCallEvents).toHaveLength(0);
		await session.processSignal(hangupSignal);
		expect(endedCallEvents).toHaveLength(1);

		session.endSession();
	});
});
