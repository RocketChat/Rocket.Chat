import { createFakeAudioStream } from './FakeMediaStream';
import type { FakeRTCPeerConnection } from './FakeRTCPeerConnection';
import { buildFakeSdp, intersectDirections, parseFakeSdp, reverseDirection } from './fakeSdp';
import { installFakeWebRTC, type FakeWebRTCController } from './installFakeWebRTC';

describe('the fake SDP', () => {
	it('round-trips the peer id and the media sections', () => {
		const description = {
			peerId: 'peer-a',
			sections: [
				{ kind: 'audio' as const, mid: '0', direction: 'sendrecv' as const, streamId: 'stream-1', trackId: 'track-1' },
				{ kind: 'video' as const, mid: '1', direction: 'recvonly' as const, streamId: null, trackId: null },
			],
		};

		expect(parseFakeSdp(buildFakeSdp(description))).toEqual(description);
	});

	it('uses CRLF line endings, as the SDP grammar requires', () => {
		const sdp = buildFakeSdp({ peerId: 'peer-a', sections: [] });

		expect(sdp.split('\r\n').length).toBeGreaterThan(1);
		expect(sdp).not.toMatch(/[^\r]\n/);
	});

	it('mirrors a direction for the other side of the call', () => {
		expect(reverseDirection('sendonly')).toBe('recvonly');
		expect(reverseDirection('recvonly')).toBe('sendonly');
		expect(reverseDirection('sendrecv')).toBe('sendrecv');
		expect(reverseDirection('inactive')).toBe('inactive');
	});

	it.each([
		['sendrecv', 'sendrecv', 'sendrecv'],
		['sendrecv', 'recvonly', 'sendonly'],
		['sendrecv', 'sendonly', 'recvonly'],
		['recvonly', 'sendrecv', 'recvonly'],
		['recvonly', 'recvonly', 'inactive'],
		['sendonly', 'sendonly', 'inactive'],
		['inactive', 'sendrecv', 'inactive'],
	] as [RTCRtpTransceiverDirection, RTCRtpTransceiverDirection, RTCRtpTransceiverDirection][])(
		'agrees on %s against %s as %s',
		(local, remote, expected) => {
			expect(intersectDirections(local, remote)).toBe(expected);
		},
	);
});

describe('the fake peer connection', () => {
	let webrtc: FakeWebRTCController;

	beforeEach(() => {
		jest.useFakeTimers();
		webrtc = installFakeWebRTC();
	});

	afterEach(() => {
		webrtc.uninstall();
		jest.clearAllTimers();
		jest.useRealTimers();
	});

	const createPeerWithAudio = (): { peer: FakeRTCPeerConnection; stream: MediaStream } => {
		const peer = new RTCPeerConnection() as FakeRTCPeerConnection;
		const stream = createFakeAudioStream();

		peer.addTrack(stream.getAudioTracks()[0], stream);

		return { peer, stream };
	};

	const negotiate = async (offerer: RTCPeerConnection, answerer: RTCPeerConnection): Promise<void> => {
		const offer = await offerer.createOffer();
		await offerer.setLocalDescription(offer);
		await answerer.setRemoteDescription(offer);

		const answer = await answerer.createAnswer();
		await answerer.setLocalDescription(answer);
		await offerer.setRemoteDescription(answer);
	};

	it('delivers each sender track to the other peer', async () => {
		const { peer: local } = createPeerWithAudio();
		const { peer: remote, stream: remoteStream } = createPeerWithAudio();

		const receivedByLocal: RTCTrackEvent[] = [];
		const receivedByRemote: RTCTrackEvent[] = [];
		local.ontrack = (event) => receivedByLocal.push(event);
		remote.ontrack = (event) => receivedByRemote.push(event);

		await negotiate(local, remote);

		expect(receivedByRemote).toHaveLength(1);
		expect(receivedByLocal).toHaveLength(1);
		expect(receivedByLocal[0]?.streams[0]?.id).toBe(remoteStream.id);
		expect(receivedByLocal[0]?.track.kind).toBe('audio');
	});

	it('connects both peers once the negotiation finishes', async () => {
		const { peer: local } = createPeerWithAudio();
		const { peer: remote } = createPeerWithAudio();

		await negotiate(local, remote);
		await jest.advanceTimersByTimeAsync(10);

		expect(local.connectionState).toBe('connected');
		expect(remote.connectionState).toBe('connected');
		expect(local.signalingState).toBe('stable');
	});

	it('completes ICE gathering after the configured delay', async () => {
		webrtc.configure({ iceGatheringDelay: 50 });

		const { peer } = createPeerWithAudio();
		const candidates: (RTCIceCandidate | null)[] = [];
		peer.onicecandidate = (event) => candidates.push(event.candidate);

		await peer.setLocalDescription(await peer.createOffer());

		expect(peer.iceGatheringState).toBe('gathering');

		await jest.advanceTimersByTimeAsync(50);

		expect(peer.iceGatheringState).toBe('complete');
		expect(candidates[candidates.length - 1]).toBeNull();
	});

	it('never completes ICE gathering when told not to', async () => {
		webrtc.configure({ completeIceGathering: false });

		const { peer } = createPeerWithAudio();

		await peer.setLocalDescription(await peer.createOffer());
		await jest.advanceTimersByTimeAsync(10000);

		expect(peer.iceGatheringState).toBe('gathering');
	});

	it('fails the connection when told to', async () => {
		webrtc.configure({ connectionOutcome: 'failed' });

		const { peer: local } = createPeerWithAudio();
		const { peer: remote } = createPeerWithAudio();

		await negotiate(local, remote);
		await jest.advanceTimersByTimeAsync(10);

		expect(local.connectionState).toBe('failed');
		expect(remote.connectionState).toBe('failed');
	});

	it('pairs a data channel with one on the other peer', async () => {
		const { peer: local } = createPeerWithAudio();
		const { peer: remote } = createPeerWithAudio();

		const channel = local.createDataChannel('rocket.chat');
		let announced: RTCDataChannel | null = null;
		const received: string[] = [];

		remote.ondatachannel = (event) => {
			announced = event.channel;
			announced.onmessage = (message) => received.push(message.data);
		};

		await negotiate(local, remote);
		await jest.advanceTimersByTimeAsync(10);

		channel.send('ping');

		expect(announced).not.toBeNull();
		expect(channel.readyState).toBe('open');
		expect(received).toEqual(['ping']);
	});

	it('answers with the media sections the offer had, and no more', async () => {
		const { peer: local } = createPeerWithAudio();
		const { peer: remote, stream } = createPeerWithAudio();

		const extra = createFakeAudioStream();
		remote.addTrack(extra.getAudioTracks()[0], extra);

		const offer = await local.createOffer();
		await local.setLocalDescription(offer);
		await remote.setRemoteDescription(offer);

		const answer = await remote.createAnswer();

		expect(parseFakeSdp(offer.sdp || '').sections).toHaveLength(1);
		expect(parseFakeSdp(answer.sdp || '').sections).toHaveLength(1);
		expect(parseFakeSdp(answer.sdp || '').sections[0]?.streamId).toBe(stream.id);
	});

	it('asks for a new negotiation when a track has no place in the current one', async () => {
		const { peer: local } = createPeerWithAudio();
		const { peer: remote } = createPeerWithAudio();

		await negotiate(local, remote);
		await jest.advanceTimersByTimeAsync(10);

		const negotiationRequests: number[] = [];
		local.onnegotiationneeded = () => negotiationRequests.push(1);

		const video = createFakeAudioStream();
		local.addTransceiver('video', { direction: 'sendrecv', streams: [video] });
		await jest.advanceTimersByTimeAsync(10);

		expect(negotiationRequests).toHaveLength(1);
	});

	it('does not ask for a new negotiation when nothing changed', async () => {
		const { peer: local } = createPeerWithAudio();
		const { peer: remote } = createPeerWithAudio();

		const negotiationRequests: number[] = [];

		await negotiate(local, remote);
		local.onnegotiationneeded = () => negotiationRequests.push(1);
		await jest.advanceTimersByTimeAsync(1000);

		expect(negotiationRequests).toHaveLength(0);
	});

	it('reports the configured audio level on the stats of an audio track', async () => {
		webrtc.configure({ audioLevel: 0.42 });

		const { peer, stream } = createPeerWithAudio();
		const levels: number[] = [];

		const report = await peer.getStats(stream.getAudioTracks()[0]);
		report.forEach((entry: any) => {
			if (entry.type === 'media-source') {
				levels.push(entry.audioLevel);
			}
		});

		expect(levels).toEqual([0.42]);
	});
});
