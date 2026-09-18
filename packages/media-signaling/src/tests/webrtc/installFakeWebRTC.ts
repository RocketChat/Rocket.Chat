import { FakeMediaStream, resetFakeStreamIds } from './FakeMediaStream';
import { resetFakeTrackIds } from './FakeMediaStreamTrack';
import {
	FakeRTCPeerConnectionClass,
	findFakePeerByStreamId,
	getFakeWebRTCOptions,
	listFakePeers,
	resetFakeWebRTC,
	setFakeWebRTCOptions,
	type FakeRTCPeerConnection,
	type FakeWebRTCOptions,
} from './FakeRTCPeerConnection';

/** The fake WebRTC stack, for tests that need to steer it after a call is already running. */
export interface FakeWebRTCController {
	readonly options: FakeWebRTCOptions;
	/** Applies to peer connections created after this call, matching how a test arranges a scenario up front. */
	configure(options: Partial<FakeWebRTCOptions>): void;
	peers(): FakeRTCPeerConnection[];
	/** Finds the peer connection that sends a given stream, which identifies one side of one call. */
	findPeerByStreamId(streamId: string): FakeRTCPeerConnection | null;
	uninstall(): void;
}

type GlobalWithWebRTC = typeof globalThis & {
	RTCPeerConnection?: typeof RTCPeerConnection;
	MediaStream?: typeof MediaStream;
};

export const installFakeWebRTC = (options: Partial<FakeWebRTCOptions> = {}): FakeWebRTCController => {
	const target = globalThis as GlobalWithWebRTC;
	const originalPeerConnection = target.RTCPeerConnection;
	const originalMediaStream = target.MediaStream;

	resetFakeWebRTC();
	resetFakeStreamIds();
	resetFakeTrackIds();
	setFakeWebRTCOptions(options);

	target.RTCPeerConnection = FakeRTCPeerConnectionClass;
	target.MediaStream = FakeMediaStream;

	return {
		get options() {
			return getFakeWebRTCOptions();
		},
		configure: setFakeWebRTCOptions,
		peers: listFakePeers,
		findPeerByStreamId: findFakePeerByStreamId,
		uninstall: () => {
			resetFakeWebRTC();

			target.RTCPeerConnection = originalPeerConnection;
			target.MediaStream = originalMediaStream;
		},
	};
};
