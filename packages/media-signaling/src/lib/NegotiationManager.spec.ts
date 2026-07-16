import { Emitter } from '@rocket.chat/emitter';

import { NegotiationManager } from './NegotiationManager';
import type { IClientMediaCall, IWebRTCProcessor } from '../definition';

const flushMicrotasks = () => new Promise(process.nextTick);

const createWebRTCProcessorMock = () =>
	({
		emitter: new Emitter(),
		createOffer: jest.fn().mockResolvedValue({ type: 'offer', sdp: 'offer-sdp' }),
		createAnswer: jest.fn().mockResolvedValue({ type: 'answer', sdp: 'answer-sdp' }),
		setLocalDescription: jest.fn().mockResolvedValue(undefined),
		setRemoteDescription: jest.fn().mockResolvedValue(undefined),
		getLocalDescription: jest.fn().mockReturnValue({ type: 'offer', sdp: 'offer-sdp' }),
		waitForIceGathering: jest.fn().mockResolvedValue(undefined),
		streams: {
			hasAllRequiredTracks: jest.fn().mockReturnValue(true),
		},
	}) as unknown as IWebRTCProcessor;

const createCallMock = () =>
	({
		state: 'active',
		hidden: false,
		localParticipant: { role: 'caller' },
	}) as unknown as IClientMediaCall;

describe('NegotiationManager', () => {
	it('emits negotiation-needed immediately when no negotiation is in progress', async () => {
		const manager = new NegotiationManager(createCallMock(), {});
		const webrtcProcessor = createWebRTCProcessorMock();
		manager.setWebRTCProcessor(webrtcProcessor);

		const onNegotiationNeeded = jest.fn();
		manager.emitter.on('negotiation-needed', onNegotiationNeeded);

		await manager.addNegotiation('n1');
		await manager.setRemoteDescription('n1', { type: 'answer', sdp: 'answer-sdp' });
		await flushMicrotasks();

		webrtcProcessor.emitter.emit('negotiationNeeded');

		expect(onNegotiationNeeded).toHaveBeenCalledTimes(1);
		expect(onNegotiationNeeded).toHaveBeenCalledWith({ oldNegotiationId: 'n1' });
	});

	it('defers negotiation-needed while a negotiation is waiting for an answer and emits it once the negotiation ends', async () => {
		const manager = new NegotiationManager(createCallMock(), {});
		const webrtcProcessor = createWebRTCProcessorMock();
		manager.setWebRTCProcessor(webrtcProcessor);

		const onNegotiationNeeded = jest.fn();
		manager.emitter.on('negotiation-needed', onNegotiationNeeded);

		// local negotiation stays active until the remote answer arrives
		await manager.addNegotiation('n1');
		await flushMicrotasks();

		webrtcProcessor.emitter.emit('negotiationNeeded');
		expect(onNegotiationNeeded).not.toHaveBeenCalled();

		await manager.setRemoteDescription('n1', { type: 'answer', sdp: 'answer-sdp' });
		await flushMicrotasks();

		expect(onNegotiationNeeded).toHaveBeenCalledTimes(1);
		expect(onNegotiationNeeded).toHaveBeenCalledWith({ oldNegotiationId: 'n1' });
	});

	it('does not emit a deferred negotiation-needed when a queued negotiation already fulfills it', async () => {
		const manager = new NegotiationManager(createCallMock(), {});
		const webrtcProcessor = createWebRTCProcessorMock();
		manager.setWebRTCProcessor(webrtcProcessor);

		const onNegotiationNeeded = jest.fn();
		manager.emitter.on('negotiation-needed', onNegotiationNeeded);

		await manager.addNegotiation('n1');
		await flushMicrotasks();

		webrtcProcessor.emitter.emit('negotiationNeeded');

		// a new local negotiation requested by the server fulfills the deferred need
		await manager.setRemoteDescription('n1', { type: 'answer', sdp: 'answer-sdp' });
		await manager.addNegotiation('n2');
		await flushMicrotasks();
		await manager.setRemoteDescription('n2', { type: 'answer', sdp: 'answer-sdp' });
		await flushMicrotasks();

		expect(onNegotiationNeeded).not.toHaveBeenCalled();
	});
});
