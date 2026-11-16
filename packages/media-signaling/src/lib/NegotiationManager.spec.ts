import { Emitter } from '@rocket.chat/emitter';

import { NegotiationManager } from './NegotiationManager.js';
import { SDP } from './services/webrtc/sdp.js';
import type { IClientMediaCall, IWebRTCProcessor, NegotiationManagerEvents, WebRTCProcessorEvents } from '../definition/index.js';

const localSdp = [
	'v=0',
	'o=- 1 2 IN IP4 127.0.0.1',
	's=-',
	't=0 0',
	'a=group:BUNDLE 0 1',
	'm=audio 9 UDP/TLS/RTP/SAVPF 111',
	'a=mid:0',
	'a=msid:main-stream audio-track',
	'a=sendrecv',
	'm=video 9 UDP/TLS/RTP/SAVPF 96',
	'a=mid:1',
	'a=msid:screen-stream screen-track',
	'a=sendrecv',
	'',
].join('\r\n');

const remoteOffer: RTCSessionDescriptionInit = { type: 'offer' };

type FakeProcessor = Pick<
	IWebRTCProcessor,
	| 'emitter'
	| 'streams'
	| 'createOffer'
	| 'createAnswer'
	| 'setLocalDescription'
	| 'setRemoteDescription'
	| 'waitForIceGathering'
	| 'getLocalDescription'
>;

const createProcessor = () => {
	let localDescription: RTCSessionDescriptionInit | null = null;

	const processor = {
		emitter: new Emitter<WebRTCProcessorEvents>(),
		streams: {
			hasAllRequiredTracks: () => true,
			mainLocal: { stream: { id: 'main-stream' } },
			screenShareLocal: { stream: { id: 'screen-stream' } },
		} as unknown as IWebRTCProcessor['streams'],
		createOffer: jest.fn(async () => ({ type: 'offer' as const, sdp: localSdp })),
		createAnswer: jest.fn(async () => ({ type: 'answer' as const })),
		setLocalDescription: jest.fn(async (sdp: RTCSessionDescriptionInit) => {
			localDescription = sdp;
		}),
		setRemoteDescription: jest.fn(),
		waitForIceGathering: jest.fn(),
		getLocalDescription: jest.fn(() => localDescription),
	} satisfies FakeProcessor;

	return processor;
};

const createManager = (role: 'caller' | 'callee', processor: FakeProcessor) => {
	const call = { localParticipant: { role } } as unknown as IClientMediaCall;
	const manager = new NegotiationManager(call, {});
	manager.setWebRTCProcessor(processor as IWebRTCProcessor);

	const localSdps: NegotiationManagerEvents['local-sdp'][] = [];
	const errors: NegotiationManagerEvents['error'][] = [];
	manager.emitter.on('local-sdp', (event) => localSdps.push(event));
	manager.emitter.on('error', (event) => errors.push(event));

	return { manager, localSdps, errors };
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

it('should tag the main media and the screen share of the local SDP with the stream ids of the processor', async () => {
	const { manager, localSdps } = createManager('caller', createProcessor());

	await manager.addNegotiation('n1');
	await flush();

	expect(localSdps).toHaveLength(1);
	expect(SDP.getStreamContentMapFromSDP(localSdps[0].sdp.sdp as string)).toEqual({ 'main-stream': 'main', 'screen-stream': 'slides' });
});

it('should send the local SDP only after ICE gathering finishes', async () => {
	const processor = createProcessor();
	let finishGathering: () => void = () => undefined;
	processor.waitForIceGathering.mockImplementationOnce(() => new Promise<void>((resolve) => (finishGathering = resolve)));
	const { manager, localSdps } = createManager('caller', processor);

	await manager.addNegotiation('n1');
	await flush();
	expect(localSdps).toEqual([]);

	finishGathering();
	await flush();
	expect(localSdps).toHaveLength(1);
});

it('should keep a local negotiation open until its answer arrives', async () => {
	const { manager } = createManager('caller', createProcessor());

	await manager.addNegotiation('n1');
	await flush();
	expect(manager.hasFinishedAnyNegotiation).toBe(false);

	await manager.setRemoteDescription('n1', { type: 'answer', sdp: 'remote-answer' });
	await flush();

	expect(manager.hasFinishedAnyNegotiation).toBe(true);
});

it('should answer a remote offer that arrives during a negotiation once that negotiation ends', async () => {
	const { manager, localSdps } = createManager('callee', createProcessor());

	await manager.addNegotiation('n1', remoteOffer);
	await manager.addNegotiation('n2', remoteOffer);
	await flush();

	expect(localSdps.map(({ negotiationId }) => negotiationId)).toEqual(['n1', 'n2']);
});

it('should drop the local offer of the polite side without an error when a remote offer interrupts it', async () => {
	const processor = createProcessor();
	let resolveOffer: () => void = () => undefined;
	processor.createOffer.mockImplementationOnce(
		() => new Promise((resolve) => (resolveOffer = () => resolve({ type: 'offer', sdp: localSdp }))),
	);
	const { manager, localSdps, errors } = createManager('callee', processor);

	await manager.addNegotiation('local');
	await manager.addNegotiation('remote', remoteOffer);
	resolveOffer();
	await flush();

	expect(localSdps.map(({ negotiationId }) => negotiationId)).toEqual(['remote']);
	expect(errors).toEqual([]);
});

it.each([
	['setting the remote offer', 'setRemoteDescription', 'failed-to-set-remote-description'],
	['creating the answer', 'createAnswer', 'failed-to-create-local-answer'],
	['setting the local description', 'setLocalDescription', 'failed-to-set-local-description'],
] as const)('should report an error and send no local SDP when the processor fails at %s', async (_step, method, errorCode) => {
	const processor = createProcessor();
	processor[method].mockRejectedValueOnce(new Error('processor failure'));
	const { manager, localSdps, errors } = createManager('callee', processor);

	await manager.addNegotiation('n1', remoteOffer);
	await flush();

	expect(errors).toEqual([{ errorCode, negotiationId: 'n1' }]);
	expect(localSdps).toEqual([]);
});

it('should report an error and send no local SDP when the processor has no local description', async () => {
	const processor = createProcessor();
	processor.getLocalDescription.mockReturnValueOnce(null);
	const { manager, localSdps, errors } = createManager('callee', processor);

	await manager.addNegotiation('n1', remoteOffer);
	await flush();

	expect(errors).toEqual([{ errorCode: 'failed-to-get-local-description', negotiationId: 'n1' }]);
	expect(localSdps).toEqual([]);
});

it('should report no error and keep the local negotiation open when the processor fails to create the offer', async () => {
	const processor = createProcessor();
	processor.createOffer.mockRejectedValueOnce(new Error('processor failure'));
	const { manager, localSdps, errors } = createManager('caller', processor);

	await manager.addNegotiation('n1');
	await manager.addNegotiation('n2');
	await flush();

	expect(errors).toEqual([]);
	expect(localSdps).toEqual([]);
	expect(manager.currentNegotiationId).toBe('n1');
});
