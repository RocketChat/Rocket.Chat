import { createFakeStream } from './FakeMediaStream';
import { createFakeTrack, type FakeMediaStreamTrack } from './FakeMediaStreamTrack';
import { buildFakeSdp, intersectDirections, parseFakeSdp, type FakeSdpMediaSection } from './fakeSdp';

export type FakeWebRTCOptions = {
	/** Virtual milliseconds between the start of ICE gathering and its completion. */
	iceGatheringDelay: number;
	/** Virtual milliseconds between a finished negotiation and the connected state. */
	connectionDelay: number;
	/** When false, ICE gathering never completes, so the code under test hits its own gathering timeout. */
	completeIceGathering: boolean;
	/** The state a peer reaches after a finished negotiation. */
	connectionOutcome: 'connected' | 'failed';
	/** The value the fake reports on both the media-source and inbound-rtp audio stats. */
	audioLevel: number;
};

export const defaultFakeWebRTCOptions: FakeWebRTCOptions = {
	iceGatheringDelay: 1,
	connectionDelay: 1,
	completeIceGathering: true,
	connectionOutcome: 'connected',
	audioLevel: 0,
};

/** Test-only levers a fake peer connection exposes on top of the RTCPeerConnection surface. */
export interface FakePeerControls {
	readonly peerId: string;
	readonly options: FakeWebRTCOptions;
	readonly remotePeer: FakeRTCPeerConnection | null;
	readonly dataChannels: FakeRTCDataChannel[];
	/** Stream ids this peer sends, so a test can tell two peers of the same call apart. */
	localStreamIds(): string[];
	/** Moves the connection to a state the code under test reacts to, as a network change would. */
	simulateConnectionState(state: RTCPeerConnectionState): void;
	simulateIceConnectionState(state: RTCIceConnectionState): void;
	simulateIceCandidateError(): void;
}

export type FakeRTCPeerConnection = RTCPeerConnection & FakePeerControls;

export type FakeRTCDataChannel = RTCDataChannel & { deliver(data: string): void };

type PeerHandlers = {
	ontrack: ((event: RTCTrackEvent) => void) | null;
	onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null;
	onicecandidateerror: ((event: RTCPeerConnectionIceErrorEvent) => void) | null;
	onconnectionstatechange: (() => void) | null;
	oniceconnectionstatechange: (() => void) | null;
	onnegotiationneeded: (() => void) | null;
	onicegatheringstatechange: (() => void) | null;
	onsignalingstatechange: (() => void) | null;
	ondatachannel: ((event: RTCDataChannelEvent) => void) | null;
};

const peerRegistry = new Map<string, FakePeer>();

let peerCount = 0;

let sharedOptions: FakeWebRTCOptions = { ...defaultFakeWebRTCOptions };

class FakeDataChannel extends EventTarget {
	public readyState: RTCDataChannelState = 'connecting';

	public onopen: ((event: Event) => void) | null = null;

	public onclose: ((event: Event) => void) | null = null;

	public onerror: ((event: Event) => void) | null = null;

	public onmessage: ((event: MessageEvent) => void) | null = null;

	public partner: FakeDataChannel | null = null;

	public readonly sentMessages: string[] = [];

	constructor(public readonly label: string) {
		super();
	}

	public send(data: string): void {
		if (this.readyState !== 'open') {
			throw new Error('InvalidStateError');
		}

		this.sentMessages.push(data);
		this.partner?.deliver(data);
	}

	public deliver(data: string): void {
		this.onmessage?.({ data } as MessageEvent);
	}

	public open(): void {
		if (this.readyState === 'open') {
			return;
		}

		this.readyState = 'open';
		this.onopen?.(new Event('open'));
	}

	public close(): void {
		if (this.readyState === 'closed') {
			return;
		}

		this.readyState = 'closed';
		this.onclose?.(new Event('close'));
	}
}

class FakeSender {
	public track: MediaStreamTrack | null = null;

	public streams: MediaStream[] = [];

	constructor(private readonly transceiver: FakeTransceiver) {}

	public async replaceTrack(track: MediaStreamTrack | null): Promise<void> {
		if (track && track.kind !== this.transceiver.kind) {
			throw new Error('InvalidModificationError');
		}

		this.track = track;
	}

	public getParameters(): RTCRtpSendParameters {
		return { encodings: [], codecs: [], headerExtensions: [], rtcp: {}, transactionId: '' };
	}

	public async setParameters(): Promise<void> {
		return undefined;
	}

	public async getStats(): Promise<RTCStatsReport> {
		return new Map() as unknown as RTCStatsReport;
	}
}

/**
 * A receiver always carries a track, as the WebRTC spec requires: the code under test finds a
 * transceiver by the kind of its sender or receiver track, so a receiver without one disappears.
 */
class FakeReceiver {
	public readonly track: FakeMediaStreamTrack;

	/** The id the sending peer used for this track, so a repeated remote section is not re-delivered. */
	public remoteTrackId: string | null = null;

	constructor(kind: 'audio' | 'video') {
		this.track = createFakeTrack(kind);
	}

	public async getStats(): Promise<RTCStatsReport> {
		return new Map() as unknown as RTCStatsReport;
	}
}

class FakeTransceiver {
	public mid: string | null = null;

	public currentDirection: RTCRtpTransceiverDirection | null = null;

	public stopped = false;

	public readonly sender: FakeSender;

	public readonly receiver: FakeReceiver;

	private _direction: RTCRtpTransceiverDirection;

	public get direction(): RTCRtpTransceiverDirection {
		return this._direction;
	}

	public set direction(direction: RTCRtpTransceiverDirection) {
		if (this._direction === direction) {
			return;
		}

		this._direction = direction;
		this.peer.scheduleNegotiationNeededCheck();
	}

	constructor(
		private readonly peer: FakePeer,
		public readonly kind: 'audio' | 'video',
		direction: RTCRtpTransceiverDirection,
	) {
		this._direction = direction;
		this.sender = new FakeSender(this);
		this.receiver = new FakeReceiver(kind);
	}

	public stop(): void {
		this.stopped = true;
		this._direction = 'stopped';
		this.currentDirection = 'stopped';
	}
}

class FakePeer {
	public readonly peerId: string;

	public readonly options: FakeWebRTCOptions;

	public readonly transceivers: FakeTransceiver[] = [];

	public readonly dataChannels: FakeDataChannel[] = [];

	public signalingState: RTCSignalingState = 'stable';

	public connectionState: RTCPeerConnectionState = 'new';

	public iceConnectionState: RTCIceConnectionState = 'new';

	public iceGatheringState: RTCIceGatheringState = 'new';

	public localDescription: RTCSessionDescriptionInit | null = null;

	public remoteDescription: RTCSessionDescriptionInit | null = null;

	public pendingLocalDescription: RTCSessionDescriptionInit | null = null;

	public pendingRemoteDescription: RTCSessionDescriptionInit | null = null;

	public remotePeer: FakePeer | null = null;

	public ontrack: PeerHandlers['ontrack'] = null;

	public onicecandidate: PeerHandlers['onicecandidate'] = null;

	public onicecandidateerror: PeerHandlers['onicecandidateerror'] = null;

	public onconnectionstatechange: PeerHandlers['onconnectionstatechange'] = null;

	public oniceconnectionstatechange: PeerHandlers['oniceconnectionstatechange'] = null;

	public onnegotiationneeded: PeerHandlers['onnegotiationneeded'] = null;

	public onicegatheringstatechange: PeerHandlers['onicegatheringstatechange'] = null;

	public onsignalingstatechange: PeerHandlers['onsignalingstatechange'] = null;

	public ondatachannel: PeerHandlers['ondatachannel'] = null;

	private closed = false;

	private remoteSections: FakeSdpMediaSection[] = [];

	private remoteStreams = new Map<string, MediaStream>();

	private negotiationCheckScheduled = false;

	private announcedChannels = new Set<FakeDataChannel>();

	constructor(public readonly configuration: RTCConfiguration = {}) {
		peerCount++;
		this.peerId = `fake-peer-${peerCount}`;
		this.options = { ...sharedOptions };

		peerRegistry.set(this.peerId, this);
	}

	public getTransceivers(): FakeTransceiver[] {
		return [...this.transceivers];
	}

	public getSenders(): FakeSender[] {
		return this.transceivers.map(({ sender }) => sender);
	}

	public getReceivers(): FakeReceiver[] {
		return this.transceivers.map(({ receiver }) => receiver);
	}

	public addTransceiver(kindOrTrack: 'audio' | 'video' | MediaStreamTrack, init: RTCRtpTransceiverInit = {}): FakeTransceiver {
		const kind = typeof kindOrTrack === 'string' ? kindOrTrack : (kindOrTrack.kind as 'audio' | 'video');
		const transceiver = this.createTransceiver(kind, init.direction || 'sendrecv');

		if (typeof kindOrTrack !== 'string') {
			transceiver.sender.track = kindOrTrack;
			transceiver.sender.streams = [...(init.streams || [])];
		}

		this.scheduleNegotiationNeededCheck();
		return transceiver;
	}

	public addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): FakeSender {
		const kind = track.kind as 'audio' | 'video';
		const reusable = this.transceivers.find(
			(transceiver) => transceiver.kind === kind && !transceiver.stopped && !transceiver.sender.track,
		);
		const transceiver = reusable || this.createTransceiver(kind, 'sendrecv');

		transceiver.sender.track = track;
		transceiver.sender.streams = streams;

		if (transceiver.direction === 'recvonly') {
			transceiver.direction = 'sendrecv';
		} else if (transceiver.direction === 'inactive') {
			transceiver.direction = 'sendonly';
		}

		this.scheduleNegotiationNeededCheck();
		return transceiver.sender;
	}

	public removeTrack(sender: FakeSender): void {
		sender.track = null;
		this.scheduleNegotiationNeededCheck();
	}

	public async createOffer(): Promise<RTCSessionDescriptionInit> {
		this.assertOpen();

		return { type: 'offer', sdp: this.buildOfferSdp() };
	}

	public async createAnswer(): Promise<RTCSessionDescriptionInit> {
		this.assertOpen();

		if (this.signalingState !== 'have-remote-offer') {
			throw new Error('InvalidStateError');
		}

		return { type: 'answer', sdp: this.buildAnswerSdp() };
	}

	public async setLocalDescription(description?: RTCSessionDescriptionInit): Promise<void> {
		this.assertOpen();

		const sdp = description || (this.signalingState === 'have-remote-offer' ? await this.createAnswer() : await this.createOffer());

		this.assignMids(sdp.sdp || '');

		if (sdp.type === 'offer') {
			this.pendingLocalDescription = sdp;
			this.localDescription = sdp;
			this.setSignalingState('have-local-offer');
		} else {
			this.localDescription = sdp;
			this.pendingLocalDescription = null;
			this.completeNegotiation();
		}

		this.startIceGathering();
	}

	public async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
		this.assertOpen();

		const parsed = parseFakeSdp(description.sdp || '');
		this.linkTo(parsed.peerId);
		this.remoteSections = parsed.sections;

		if (description.type === 'offer') {
			this.pendingRemoteDescription = description;
			this.remoteDescription = description;
			this.setSignalingState('have-remote-offer');
			this.applyRemoteSections();
			return;
		}

		this.remoteDescription = description;
		this.pendingRemoteDescription = null;
		this.applyRemoteSections();
		this.completeNegotiation();
	}

	public createDataChannel(label: string): FakeDataChannel {
		this.assertOpen();

		const channel = new FakeDataChannel(label);
		this.dataChannels.push(channel);

		if (this.connectionState === 'connected') {
			this.announceDataChannels();
		}

		return channel;
	}

	public restartIce(): void {
		if (this.closed) {
			return;
		}

		this.iceGatheringState = 'new';
		this.startIceGathering();
	}

	public async getStats(selector?: MediaStreamTrack | null): Promise<RTCStatsReport> {
		const report = new Map<string, Record<string, unknown>>();

		if (selector?.kind === 'audio') {
			report.set('media-source-1', { id: 'media-source-1', type: 'media-source', kind: 'audio', audioLevel: this.options.audioLevel });
			report.set('inbound-rtp-1', { id: 'inbound-rtp-1', type: 'inbound-rtp', kind: 'audio', audioLevel: this.options.audioLevel });
		}

		return report as unknown as RTCStatsReport;
	}

	/** Drops the peer without notifying the code under test, for a harness that is tearing down. */
	public teardown(): void {
		this.ontrack = null;
		this.onicecandidate = null;
		this.onicecandidateerror = null;
		this.onconnectionstatechange = null;
		this.oniceconnectionstatechange = null;
		this.onnegotiationneeded = null;
		this.onicegatheringstatechange = null;
		this.onsignalingstatechange = null;
		this.ondatachannel = null;

		for (const channel of this.dataChannels) {
			channel.onopen = null;
			channel.onclose = null;
			channel.onmessage = null;
			channel.onerror = null;
		}

		this.close();
	}

	public close(): void {
		if (this.closed) {
			return;
		}

		this.closed = true;
		this.signalingState = 'closed';
		this.connectionState = 'closed';
		this.iceConnectionState = 'closed';

		for (const channel of this.dataChannels) {
			channel.close();
		}

		for (const transceiver of this.transceivers) {
			transceiver.stop();
		}

		if (this.remotePeer?.remotePeer === this) {
			this.remotePeer.remotePeer = null;
		}
		this.remotePeer = null;
		peerRegistry.delete(this.peerId);
	}

	public localStreamIds(): string[] {
		const ids = this.transceivers.flatMap(({ sender }) => sender.streams.map(({ id }) => id));

		return [...new Set(ids)];
	}

	public simulateConnectionState(state: RTCPeerConnectionState): void {
		this.setConnectionState(state);
	}

	public simulateIceConnectionState(state: RTCIceConnectionState): void {
		if (this.iceConnectionState === state) {
			return;
		}

		this.iceConnectionState = state;
		this.oniceconnectionstatechange?.();
	}

	public simulateIceCandidateError(): void {
		this.onicecandidateerror?.({ errorCode: 701, errorText: 'fake ice failure' } as RTCPeerConnectionIceErrorEvent);
	}

	public scheduleNegotiationNeededCheck(): void {
		if (this.closed || this.negotiationCheckScheduled) {
			return;
		}

		this.negotiationCheckScheduled = true;
		setTimeout(() => {
			this.negotiationCheckScheduled = false;
			if (this.closed || !this.isNegotiationNeeded()) {
				return;
			}

			this.onnegotiationneeded?.();
		}, 0);
	}

	/**
	 * Mirrors the browser rule: a transceiver that was never negotiated, or whose agreed direction no
	 * longer matches the requested one, needs a new negotiation.
	 */
	private isNegotiationNeeded(): boolean {
		if (this.signalingState !== 'stable') {
			return false;
		}

		return this.transceivers.some((transceiver) => {
			if (transceiver.stopped) {
				return false;
			}

			if (!transceiver.mid || !transceiver.currentDirection) {
				return true;
			}

			return transceiver.direction !== transceiver.currentDirection;
		});
	}

	private createTransceiver(kind: 'audio' | 'video', direction: RTCRtpTransceiverDirection): FakeTransceiver {
		const transceiver = new FakeTransceiver(this, kind, direction);
		this.transceivers.push(transceiver);

		return transceiver;
	}

	private activeTransceivers(): FakeTransceiver[] {
		return this.transceivers.filter((transceiver) => !transceiver.stopped);
	}

	private sectionFor(transceiver: FakeTransceiver, index: number): FakeSdpMediaSection {
		const { track } = transceiver.sender;
		const [stream] = transceiver.sender.streams;

		return {
			kind: transceiver.kind,
			mid: transceiver.mid || String(index),
			direction: transceiver.direction,
			streamId: track && stream ? stream.id : null,
			trackId: track && stream ? track.id : null,
		};
	}

	private buildOfferSdp(): string {
		const sections = this.activeTransceivers().map((transceiver, index) => this.sectionFor(transceiver, index));

		return buildFakeSdp({ peerId: this.peerId, sections });
	}

	/** An answer may only describe the m-lines the offer had; anything else waits for a renegotiation. */
	private buildAnswerSdp(): string {
		const active = this.activeTransceivers();
		const sections = this.remoteSections.map((remoteSection, index) => {
			const transceiver = active[index];
			if (!transceiver) {
				return { ...remoteSection, direction: 'inactive' as RTCRtpTransceiverDirection, streamId: null, trackId: null };
			}

			return { ...this.sectionFor(transceiver, index), mid: remoteSection.mid };
		});

		return buildFakeSdp({ peerId: this.peerId, sections });
	}

	private assignMids(sdp: string): void {
		const { sections } = parseFakeSdp(sdp);
		const active = this.activeTransceivers();

		sections.forEach((section, index) => {
			const transceiver = active[index];
			if (transceiver) {
				transceiver.mid = section.mid;
			}
		});
	}

	private completeNegotiation(): void {
		const active = this.activeTransceivers();

		this.remoteSections.forEach((section, index) => {
			const transceiver = active[index];
			if (!transceiver) {
				return;
			}

			transceiver.mid = section.mid;
			transceiver.currentDirection = intersectDirections(transceiver.direction, section.direction);
		});

		this.setSignalingState('stable');
		this.scheduleConnection();
		this.scheduleNegotiationNeededCheck();
	}

	private applyRemoteSections(): void {
		const active = this.activeTransceivers();

		this.remoteSections.forEach((section, index) => {
			const transceiver =
				active[index] || this.createTransceiver(section.kind, section.direction.includes('send') ? 'recvonly' : 'inactive');

			const { receiver } = transceiver;

			// A remote peer that stops sending mutes the receiver's track; it does not end it
			if (!section.direction.includes('send') || !section.trackId) {
				if (receiver.remoteTrackId) {
					receiver.track.simulateMute();
				}
				return;
			}

			if (receiver.remoteTrackId === section.trackId) {
				receiver.track.simulateUnmute();
				return;
			}

			receiver.remoteTrackId = section.trackId;
			receiver.track.simulateUnmute();

			const stream = this.getOrCreateRemoteStream(section.streamId || `remote-${section.mid}`);
			stream.addTrack(receiver.track);

			this.ontrack?.({
				track: receiver.track,
				streams: [stream],
				receiver,
				transceiver,
			} as unknown as RTCTrackEvent);
		});
	}

	private getOrCreateRemoteStream(id: string): MediaStream {
		const existing = this.remoteStreams.get(id);
		if (existing) {
			return existing;
		}

		const stream = createFakeStream([], id);
		this.remoteStreams.set(id, stream);

		return stream;
	}

	private linkTo(peerId: string): void {
		const remote = peerRegistry.get(peerId);
		if (!remote || remote === this) {
			return;
		}

		this.remotePeer = remote;
		remote.remotePeer = this;
	}

	private setSignalingState(state: RTCSignalingState): void {
		if (this.signalingState === state) {
			return;
		}

		this.signalingState = state;
		this.onsignalingstatechange?.();
	}

	private setConnectionState(state: RTCPeerConnectionState): void {
		if (this.closed || this.connectionState === state) {
			return;
		}

		this.connectionState = state;
		this.onconnectionstatechange?.();
	}

	private startIceGathering(): void {
		if (this.closed || this.iceGatheringState === 'gathering' || this.iceGatheringState === 'complete') {
			return;
		}

		this.iceGatheringState = 'gathering';
		this.onicegatheringstatechange?.();

		if (!this.options.completeIceGathering) {
			return;
		}

		setTimeout(() => {
			if (this.closed || this.iceGatheringState !== 'gathering') {
				return;
			}

			this.onicecandidate?.({
				candidate: { candidate: 'candidate:1 1 udp 2130706431 127.0.0.1 10000 typ host' },
			} as RTCPeerConnectionIceEvent);
			this.onicecandidate?.({ candidate: null } as RTCPeerConnectionIceEvent);

			this.iceGatheringState = 'complete';
			this.onicegatheringstatechange?.();
		}, this.options.iceGatheringDelay);
	}

	private scheduleConnection(): void {
		if (this.closed || this.connectionState === 'connected' || this.connectionState === 'failed') {
			return;
		}

		this.setConnectionState('connecting');
		this.simulateIceConnectionState('checking');

		setTimeout(() => {
			if (this.closed || this.connectionState !== 'connecting') {
				return;
			}

			if (this.options.connectionOutcome === 'failed') {
				this.simulateIceConnectionState('failed');
				this.setConnectionState('failed');
				return;
			}

			this.simulateIceConnectionState('connected');
			this.setConnectionState('connected');
			this.announceDataChannels();
		}, this.options.connectionDelay);
	}

	private announceDataChannels(): void {
		const remote = this.remotePeer;
		if (!remote || remote.closed) {
			return;
		}

		for (const channel of this.dataChannels) {
			if (this.announcedChannels.has(channel)) {
				continue;
			}

			this.announcedChannels.add(channel);

			const partner = new FakeDataChannel(channel.label);
			partner.partner = channel;
			channel.partner = partner;
			remote.dataChannels.push(partner);
			remote.announcedChannels.add(partner);

			remote.ondatachannel?.({ channel: partner } as unknown as RTCDataChannelEvent);

			setTimeout(() => {
				channel.open();
				partner.open();
			}, 0);
		}
	}

	private assertOpen(): void {
		if (this.closed) {
			throw new Error('InvalidStateError: the peer connection is closed');
		}
	}
}

export const FakeRTCPeerConnectionClass = FakePeer as unknown as typeof RTCPeerConnection;

export const setFakeWebRTCOptions = (options: Partial<FakeWebRTCOptions>): void => {
	sharedOptions = { ...sharedOptions, ...options };
};

export const getFakeWebRTCOptions = (): FakeWebRTCOptions => ({ ...sharedOptions });

export const listFakePeers = (): FakeRTCPeerConnection[] => [...peerRegistry.values()] as unknown as FakeRTCPeerConnection[];

export const findFakePeerByStreamId = (streamId: string): FakeRTCPeerConnection | null => {
	for (const peer of peerRegistry.values()) {
		if (peer.localStreamIds().includes(streamId)) {
			return peer as unknown as FakeRTCPeerConnection;
		}
	}

	return null;
};

export const resetFakeWebRTC = (): void => {
	for (const peer of [...peerRegistry.values()]) {
		peer.teardown();
	}

	peerRegistry.clear();
	peerCount = 0;
	sharedOptions = { ...defaultFakeWebRTCOptions };
};
