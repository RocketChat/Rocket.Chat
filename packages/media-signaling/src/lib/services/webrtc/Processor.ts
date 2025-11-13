import { Emitter } from '@rocket.chat/emitter';

import { LocalStream } from './LocalStream';
import { RemoteStream } from './RemoteStream';
import type { IWebRTCProcessor, WebRTCInternalStateMap, WebRTCProcessorConfig, WebRTCProcessorEvents } from '../../../definition';
import type { ServiceStateValue } from '../../../definition/services/IServiceProcessor';
import { getExternalWaiter, type PromiseWaiterData } from '../../utils/getExternalWaiter';

const DATA_CHANNEL_LABEL = 'rocket.chat';
type P2PCommand = 'mute' | 'unmute' | 'end';

export class MediaCallWebRTCProcessor implements IWebRTCProcessor {
	public readonly emitter: Emitter<WebRTCProcessorEvents>;

	private peer: RTCPeerConnection;

	private iceGatheringTimedOut = false;

	private localStream: LocalStream;

	private localMediaStream: MediaStream;

	private remoteStream: RemoteStream;

	private remoteMediaStream: MediaStream;

	private iceGatheringWaiters: Set<PromiseWaiterData>;

	private inputTrack: MediaStreamTrack | null;

	private _muted = false;

	public get muted(): boolean {
		return this._muted;
	}

	private _held = false;

	public get held(): boolean {
		return this._held;
	}

	private stopped = false;

	private iceCandidateCount = 0;

	private addedEmptyTransceiver = false;

	private _audioLevelTracker: ReturnType<typeof setInterval> | null;

	private _audioLevel: number;

	public get audioLevel(): number {
		return this._audioLevel;
	}

	private _localAudioLevel: number;

	private initialization: Promise<void>;

	public get localAudioLevel(): number {
		return this._localAudioLevel;
	}

	private _dataChannel: RTCDataChannel | null;

	private _remoteMute = false;

	private _dataChannelEnded = false;

	constructor(private readonly config: WebRTCProcessorConfig) {
		this.localMediaStream = new MediaStream();
		this.remoteMediaStream = new MediaStream();
		this.iceGatheringWaiters = new Set();
		this.inputTrack = config.inputTrack;
		this._audioLevel = 0;
		this._localAudioLevel = 0;
		this._audioLevelTracker = null;
		this._dataChannel = null;

		this.peer = new RTCPeerConnection(config.rtc);

		this.localStream = new LocalStream(this.localMediaStream, this.peer, this.config.logger);
		this.remoteStream = new RemoteStream(this.remoteMediaStream, this.peer, this.config.logger);

		this.emitter = new Emitter();
		this.registerPeerEvents();

		this.registerAudioLevelTracker();

		this.initialization = this.initialize().catch((e) => {
			config.logger?.error('MediaCallWebRTCProcessor.initialization error', e);
			this.stop();
		});
	}

	public getRemoteMediaStream() {
		return this.remoteMediaStream;
	}

	public async setInputTrack(newInputTrack: MediaStreamTrack | null): Promise<void> {
		this.config.logger?.debug('MediaCallWebRTCProcessor.setInputTrack');
		if (newInputTrack && newInputTrack.kind !== 'audio') {
			throw new Error('Unsupported track kind');
		}

		await this.initialization;

		this.inputTrack = newInputTrack;
		await this.loadInputTrack();
	}

	public async createOffer({ iceRestart }: { iceRestart?: boolean }): Promise<RTCSessionDescriptionInit> {
		this.config.logger?.debug('MediaCallWebRTCProcessor.createOffer');
		if (this.stopped) {
			throw new Error('WebRTC Processor has already been stopped.');
		}

		await this.initialization;

		if (!this.addedEmptyTransceiver) {
			this.config.logger?.debug('MediaCallWebRTCProcessor.createOffer.addEmptyTransceiver');
			// If there's no audio transceivers yet, add a new one; since it's an offer, the track can be set later
			const transceivers = this.getAudioTransceivers();

			if (!transceivers.length) {
				this.peer.addTransceiver('audio', { direction: 'sendrecv' });
				this.addedEmptyTransceiver = true;
			}
		}

		this.createDataChannel();
		this.updateAudioDirectionBeforeNegotiation();

		if (iceRestart) {
			this.restartIce();
		}

		return this.peer.createOffer({});
	}

	public setMuted(muted: boolean): void {
		if (this.stopped) {
			return;
		}

		this._muted = muted;
		this.localStream.setEnabled(!muted && !this._held);
		this.updateMuteForRemote();
	}

	public setHeld(held: boolean): void {
		if (this.stopped) {
			return;
		}

		this._held = held;
		this.localStream.setEnabled(!held && !this._muted);
		this.remoteStream.setEnabled(!held);

		this.updateAudioDirectionWithoutNegotiation();
	}

	public stop(): void {
		this.config.logger?.debug('MediaCallWebRTCProcessor.stop');
		this.endDataChannel();

		this.stopped = true;
		// Stop only the remote stream; the track of the local stream may still be in use by another call so it's up to the session to stop it.
		this.remoteStream.stopAudio();
		this.unregisterPeerEvents();
		this.unregisterAudioLevelTracker();

		this.peer.close();
	}

	public async createAnswer(): Promise<RTCSessionDescriptionInit> {
		this.config.logger?.debug('MediaCallWebRTCProcessor.createAnswer');
		if (this.stopped) {
			throw new Error('WebRTC Processor has already been stopped.');
		}
		if (!this.inputTrack) {
			throw new Error('no-input-track');
		}

		await this.initialization;

		const transceivers = this.getAudioTransceivers();

		if (!transceivers.length) {
			throw new Error('no-audio-transceiver');
		}

		return this.peer.createAnswer();
	}

	public async setLocalDescription(sdp: RTCSessionDescriptionInit): Promise<void> {
		this.config.logger?.debug('MediaCallWebRTCProcessor.setLocalDescription');
		if (this.stopped) {
			return;
		}

		await this.initialization;

		if (!['offer', 'answer'].includes(sdp.type)) {
			throw new Error('unsupported-description-type');
		}

		await this.peer.setLocalDescription(sdp);

		if (sdp.type === 'answer') {
			this.updateAudioDirectionAfterNegotiation();
		}
	}

	public async setRemoteDescription(sdp: RTCSessionDescriptionInit): Promise<void> {
		this.config.logger?.debug('MediaCallWebRTCProcessor.setRemoteDescription');
		if (this.stopped) {
			return;
		}

		await this.initialization;

		if (!['offer', 'answer'].includes(sdp.type)) {
			throw new Error('unsupported-description-type');
		}

		if (sdp.type === 'offer') {
			this.updateAudioDirectionBeforeNegotiation();
		}

		await this.peer.setRemoteDescription(sdp);

		if (sdp.type === 'answer') {
			this.updateAudioDirectionAfterNegotiation();
		}
	}

	public getInternalState<K extends keyof WebRTCInternalStateMap>(stateName: K): ServiceStateValue<WebRTCInternalStateMap, K> {
		switch (stateName) {
			case 'signaling':
				return this.peer.signalingState;
			case 'connection':
				return this.peer.connectionState;
			case 'iceConnection':
				return this.peer.iceConnectionState;
			case 'iceGathering':
				return this.peer.iceGatheringState;
			case 'iceUntrickler':
				if (this.iceGatheringTimedOut) {
					return 'timeout';
				}
				return this.iceGatheringWaiters.size > 0 ? 'waiting' : 'not-waiting';
			case 'remoteMute':
				return this._remoteMute;
		}
	}

	public async getStats(selector?: MediaStreamTrack | null): Promise<RTCStatsReport | null> {
		if (this.stopped) {
			return null;
		}

		await this.initialization;

		return this.peer.getStats(selector);
	}

	public isRemoteHeld(): boolean {
		if (this.stopped) {
			return false;
		}

		if (['closed', 'failed', 'new'].includes(this.peer.connectionState)) {
			return false;
		}

		let anyTransceiverNotSending = false;
		const transceivers = this.getAudioTransceivers();

		for (const transceiver of transceivers) {
			if (!transceiver.currentDirection || transceiver.currentDirection === 'stopped') {
				continue;
			}

			if (transceiver.currentDirection.includes('send')) {
				return false;
			}

			anyTransceiverNotSending = true;
		}

		return anyTransceiverNotSending;
	}

	public isRemoteMute(): boolean {
		return this._remoteMute;
	}

	public isStable(): boolean {
		if (this.stopped) {
			return false;
		}

		return this.peer.signalingState === 'stable';
	}

	public getLocalDescription(): RTCSessionDescriptionInit | null {
		this.config.logger?.debug('MediaCallWebRTCProcessor.getLocalDescription');
		if (this.stopped) {
			throw new Error('WebRTC Processor has already been stopped.');
		}

		return this.peer.localDescription;
	}

	public async waitForIceGathering(): Promise<void> {
		if (this.stopped || this.peer.iceGatheringState === 'complete') {
			return;
		}
		this.config.logger?.debug('MediaCallWebRTCProcessor.waitForIceGathering');
		await this.initialization;

		this.iceGatheringTimedOut = false;
		const iceGatheringData = getExternalWaiter({
			timeout: this.config.iceGatheringTimeout,
			timeoutFn: () => {
				if (!this.iceGatheringWaiters.has(iceGatheringData)) {
					return;
				}

				this.config.logger?.debug('MediaCallWebRTCProcessor.waitForIceGathering.timeout', this.iceCandidateCount);
				this.clearIceGatheringData(iceGatheringData);
				this.iceGatheringTimedOut = true;
				this.changeInternalState('iceUntrickler');
			},
		});

		this.iceGatheringWaiters.add(iceGatheringData);
		this.changeInternalState('iceUntrickler');
		await iceGatheringData.promise;
	}

	private async initialize(): Promise<void> {
		if (this.inputTrack) {
			await this.loadInputTrack();
		}
	}

	private startNewGathering(): void {
		this.clearIceGatheringWaiters(new Error('gathering-restarted'));
		this.iceCandidateCount = 0;
	}

	private changeInternalState(stateName: keyof WebRTCInternalStateMap): void {
		this.config.logger?.debug('MediaCallWebRTCProcessor.changeInternalState', stateName);
		this.emitter.emit('internalStateChange', stateName);
	}

	private updateAudioDirectionBeforeNegotiation(): void {
		// Before the negotiation, we set the direction based on our own state only
		// We'll tell the SDK that we want to send audio and, depending on the "on hold" state, also receive it
		const desiredDirection = this.held ? 'sendonly' : 'sendrecv';

		const transceivers = this.getAudioTransceivers();
		for (const transceiver of transceivers) {
			if (transceiver.direction === 'stopped') {
				continue;
			}

			if (transceiver.direction !== desiredDirection) {
				this.config.logger?.debug(`Changing audio direction from ${transceiver.direction} to ${desiredDirection}`);
			}

			transceiver.direction = desiredDirection;
		}
	}

	private updateAudioDirectionAfterNegotiation(): void {
		// Before the negotiation started, we told the browser we wanted to send audio - but we don't care if actually send or not, it's up to the other side to determine if they want to receive.
		// If the other side doesn't want to receive audio, the negotiation will result in a state where "direction" and "currentDirection" don't match
		// But if the only difference is that we said we want to send audio and are not sending it, then we can change what we say we want to reflect the current state

		// If we didn't do this, everything would still work, but the browser would trigger redundant renegotiations whenever the directions mismatch

		const desiredDirection = this.held ? 'sendonly' : 'sendrecv';
		const acceptableDirection = this.held ? 'inactive' : 'recvonly';

		const transceivers = this.getAudioTransceivers();
		for (const transceiver of transceivers) {
			if (transceiver.direction !== desiredDirection) {
				continue;
			}
			if (!transceiver.currentDirection || ['stopped', desiredDirection].includes(transceiver.currentDirection)) {
				continue;
			}

			if (transceiver.currentDirection === acceptableDirection) {
				this.config.logger?.debug(`Changing audio direction from ${transceiver.direction} to match ${transceiver.currentDirection}.`);
				transceiver.direction = transceiver.currentDirection;
			}
		}
	}

	private getAudioTransceivers(): RTCRtpTransceiver[] {
		return this.peer
			.getTransceivers()
			.filter((transceiver) => transceiver.sender.track?.kind === 'audio' || transceiver.receiver.track?.kind === 'audio');
	}

	private updateAudioDirectionWithoutNegotiation(): void {
		// If the signaling state is not stable, then a negotiation is already happening and the audio direction will be updated by them
		if (this.peer.signalingState !== 'stable') {
			return;
		}

		const desiredDirection = this.held ? 'sendonly' : 'sendrecv';
		const acceptableDirection = this.held ? 'inactive' : 'recvonly';

		const transceivers = this.getAudioTransceivers();
		for (const transceiver of transceivers) {
			// If the last direction we requested still matches our current requirements, then we don't need to change our request
			if ([desiredDirection, acceptableDirection, 'stopped'].includes(transceiver.direction)) {
				continue;
			}

			// If the current state of the call doesn't match what we are requesting here, the browser will trigger the negotiation-needed event for us
			this.config.logger?.debug(`Changing desired audio direction from ${transceiver.direction} to ${desiredDirection}.`);
			transceiver.direction = desiredDirection;
		}
	}

	private createDataChannel(): void {
		if (this._dataChannel || this._dataChannelEnded || !this.config.call.flags.includes('create-data-channel')) {
			return;
		}

		this.config.logger?.debug('MediaCallWebRTCProcessor.createDataChannel');
		const channel = this.peer.createDataChannel(DATA_CHANNEL_LABEL);
		this.initializeDataChannel(channel);
	}

	private endDataChannel(): void {
		this._dataChannelEnded = true;
		this.sendP2PCommand('end');
	}

	private initializeDataChannel(channel: RTCDataChannel): void {
		if (channel.label !== DATA_CHANNEL_LABEL) {
			this.config.logger?.warn('Unexpected Data Channel', channel.label);
			return;
		}

		channel.onopen = (_event) => {
			this.config.logger?.debug('Data Channel Open', channel.label);
			if (!this._dataChannel || this._dataChannel.readyState !== 'open') {
				this._dataChannel = channel;
			}

			this.updateMuteForRemote();
		};
		channel.onclose = (_event) => {
			this.config.logger?.debug('Data Channel Closed', channel.label);
			if (this._dataChannel === channel) {
				this._dataChannel = null;

				if (this.config.call.state !== 'hangup') {
					this.createDataChannel();
				}
			}
		};

		channel.onmessage = (event) => {
			if (typeof event.data !== 'string') {
				this.config.logger?.debug('Invalid Data Channel Message');
				return;
			}

			this.config.logger?.debug('Data Channel Message', event.data);
			const command = this.getCommandFromDataChannelMessage(event.data);
			if (command) {
				this.onP2PCommand(command);
			}
		};

		if (!this._dataChannel) {
			this._dataChannel = channel;
		}
	}

	private sendP2PCommand(command: P2PCommand): boolean {
		this.config.logger?.debug('MediaCallWebRTCProcessor.sendP2PCommand', command);
		if (!this._dataChannel) {
			return false;
		}

		if (this._dataChannel.readyState !== 'open') {
			return false;
		}

		const jsonCommand = JSON.stringify({ command });
		this._dataChannel.send(jsonCommand);
		return true;
	}

	private isValidCommand(command: string): command is P2PCommand {
		return ['mute', 'unmute', 'end'].includes(command);
	}

	private getCommandFromDataChannelMessage(message: string): P2PCommand | null {
		try {
			const obj = JSON.parse(message);
			if (obj.command && this.isValidCommand(obj.command)) {
				return obj.command;
			}
		} catch {
			this.config.logger?.debug('Failed to parse Data Channel Command');
		}

		return null;
	}

	private onP2PCommand(command: P2PCommand): void {
		this.config.logger?.debug('MediaCallWebRTCProcessor.onP2PCommand', command);
		switch (command) {
			case 'mute':
				this.setRemoteMute(true);
				break;
			case 'unmute':
				this.setRemoteMute(false);
				break;
			case 'end':
				this._dataChannelEnded = true;
				break;
		}
	}

	private setRemoteMute(muted: boolean): void {
		if (muted === this._remoteMute) {
			return;
		}

		this._remoteMute = muted;
		this.emitter.emit('internalStateChange', 'remoteMute');
	}

	private updateMuteForRemote(): void {
		const command: P2PCommand = this._muted ? 'mute' : 'unmute';
		this.sendP2PCommand(command);
	}

	private registerPeerEvents() {
		const { peer } = this;

		peer.ontrack = (event) => this.onTrack(event);
		peer.onicecandidate = (event) => this.onIceCandidate(event);
		peer.onicecandidateerror = (event) => this.onIceCandidateError(event);
		peer.onconnectionstatechange = () => this.onConnectionStateChange();
		peer.oniceconnectionstatechange = () => this.onIceConnectionStateChange();
		peer.onnegotiationneeded = () => this.onNegotiationNeeded();
		peer.onicegatheringstatechange = () => this.onIceGatheringStateChange();
		peer.onsignalingstatechange = () => this.onSignalingStateChange();
		peer.ondatachannel = (event) => this.onDataChannel(event);
	}

	private unregisterPeerEvents() {
		try {
			const { peer } = this;

			peer.ontrack = null as any;
			peer.onicecandidate = null as any;
			peer.onicecandidateerror = null as any;
			peer.onconnectionstatechange = null as any;
			peer.oniceconnectionstatechange = null as any;
			peer.onnegotiationneeded = null as any;
			peer.onicegatheringstatechange = null as any;
			peer.onsignalingstatechange = null as any;
			peer.ondatachannel = null as any;
		} catch {
			// suppress exceptions here
		}
	}

	private registerAudioLevelTracker() {
		if (this._audioLevelTracker) {
			this.unregisterAudioLevelTracker();
		}

		this._audioLevelTracker = setInterval(() => {
			this.getStats()
				.then((stats) => {
					if (!stats) {
						return;
					}

					stats.forEach((report) => {
						if (report.kind !== 'audio') {
							return;
						}

						switch (report.type) {
							case 'inbound-rtp':
								this._audioLevel = report.audioLevel ?? 0;
								break;
							case 'media-source':
								this._localAudioLevel = report.audioLevel ?? 0;
								break;
						}
					});
				})
				.catch(() => {
					this._audioLevel = 0;
					this._localAudioLevel = 0;
				});
		}, 50);
	}

	private unregisterAudioLevelTracker() {
		if (!this._audioLevelTracker) {
			return;
		}

		clearInterval(this._audioLevelTracker);
		this._audioLevelTracker = null;
		this._audioLevel = 0;
		this._localAudioLevel = 0;
	}

	private restartIce() {
		this.config.logger?.debug('MediaCallWebRTCProcessor.restartIce');
		this.startNewGathering();
		this.peer.restartIce();
	}

	private onIceCandidate(event: RTCPeerConnectionIceEvent) {
		if (this.stopped) {
			return;
		}

		this.config.logger?.debug('MediaCallWebRTCProcessor.onIceCandidate', event.candidate);
		this.iceCandidateCount++;
	}

	private onIceCandidateError(event: RTCPeerConnectionIceErrorEvent) {
		if (this.stopped) {
			return;
		}
		this.config.logger?.debug('MediaCallWebRTCProcessor.onIceCandidateError');
		this.config.logger?.error(event);

		this.emitter.emit('internalError', { critical: false, error: 'ice-candidate-error', errorDetails: JSON.stringify(event) });
	}

	private onNegotiationNeeded() {
		if (this.stopped || this.peer.signalingState !== 'stable') {
			return;
		}
		this.config.logger?.debug('MediaCallWebRTCProcessor.onNegotiationNeeded');
		this.emitter.emit('negotiationNeeded');
	}

	private onTrack(event: RTCTrackEvent): void {
		if (this.stopped) {
			return;
		}
		this.config.logger?.debug('MediaCallWebRTCProcessor.onTrack', event.track.kind);
		// Received a remote stream
		this.remoteStream.setTrack(event.track);
	}

	private onConnectionStateChange() {
		if (this.stopped) {
			return;
		}
		this.config.logger?.debug('MediaCallWebRTCProcessor.onConnectionStateChange');
		this.changeInternalState('connection');
	}

	private onIceConnectionStateChange() {
		if (this.stopped) {
			return;
		}
		this.config.logger?.debug('MediaCallWebRTCProcessor.onIceConnectionStateChange');
		this.changeInternalState('iceConnection');
	}

	private onSignalingStateChange() {
		if (this.stopped) {
			return;
		}

		this.config.logger?.debug('MediaCallWebRTCProcessor.onSignalingStateChange');
		this.changeInternalState('signaling');
	}

	private onIceGatheringStateChange() {
		if (this.stopped) {
			return;
		}

		const state = this.peer.iceGatheringState;

		this.config.logger?.debug('MediaCallWebRTCProcessor.onIceGatheringStateChange', state);
		if (state === 'gathering') {
			this.iceCandidateCount = 0;
		}

		if (state === 'complete') {
			this.onIceGatheringComplete();
		}

		this.changeInternalState('iceGathering');
	}

	private async loadInputTrack(): Promise<void> {
		this.config.logger?.debug('MediaCallWebRTCProcessor.loadInputTrack');
		await this.localStream.setTrack(this.inputTrack);
	}

	private onIceGatheringComplete() {
		this.config.logger?.debug('MediaCallWebRTCProcessor.onIceGatheringComplete');

		this.clearIceGatheringWaiters();
	}

	private onDataChannel(event: RTCDataChannelEvent) {
		this.config.logger?.debug('MediaCallWebRTCProcessor.onDataChannel');
		this.initializeDataChannel(event.channel);
	}

	private clearIceGatheringData(iceGatheringData: PromiseWaiterData, error?: Error) {
		this.config.logger?.debug('MediaCallWebRTCProcessor.clearIceGatheringData');
		if (this.iceGatheringWaiters.has(iceGatheringData)) {
			this.iceGatheringWaiters.delete(iceGatheringData);
		}

		if (iceGatheringData.timeout) {
			clearTimeout(iceGatheringData.timeout);
		}

		if (error) {
			if (iceGatheringData.promiseReject) {
				iceGatheringData.promiseReject(error);
			}

			return;
		}

		if (iceGatheringData.promiseResolve) {
			iceGatheringData.promiseResolve();
		}
	}

	private clearIceGatheringWaiters(error?: Error) {
		this.config.logger?.debug('MediaCallWebRTCProcessor.clearIceGatheringWaiters');
		this.iceGatheringTimedOut = false;

		if (!this.iceGatheringWaiters.size) {
			return;
		}

		const waiters = Array.from(this.iceGatheringWaiters.values());
		this.iceGatheringWaiters.clear();

		for (const iceGatheringData of waiters) {
			this.clearIceGatheringData(iceGatheringData, error);
		}

		this.changeInternalState('iceUntrickler');
	}
}
