import { Emitter } from '@rocket.chat/emitter';

import { getPexRTC } from './getPexRTC';
import type { ServiceStateValue } from '../../../definition/services/IServiceProcessor';
import type { IPexRTC } from '../../../definition/services/pexip/IPexRTC';
import type {
	IPexRTCProcessor,
	PexipConnectionState,
	PexRTCInternalStateMap,
	PexRTCProcessorConfig,
	PexRTCProcessorEvents,
} from '../../../definition/services/pexip/IPexRTCProcessor';
import { MediaStreamManager } from '../../media/MediaStreamManager';

export class MediaCallPexipProcessor implements IPexRTCProcessor {
	public readonly emitter: Emitter<PexRTCProcessorEvents>;

	public readonly streams: MediaStreamManager;

	private _connectionState: PexipConnectionState;

	public get connectionState(): PexipConnectionState {
		return this._connectionState;
	}

	private _error: any;

	public get error(): any {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return this._error;
	}

	private _muted = false;

	public get muted(): boolean {
		return this._muted;
	}

	private _held = false;

	public get held(): boolean {
		return this._held;
	}

	private stopped = false;

	constructor(
		private readonly config: PexRTCProcessorConfig,
		private readonly pexRTC: IPexRTC,
	) {
		this.emitter = new Emitter();
		this._connectionState = 'disconnected';
		this._error = null;

		this.registerPexipEvents();

		this.streams = new MediaStreamManager(null, this.config.logger);
		this.streams.emitter.on('streamChanged', () => {
			config.logger?.debug('MediaCallPexipProcessor.streamChanged');
			this.emitter.emit('streamChanged');
		});

		this.pexRTC.muteVideo(true);
	}

	public static async wrapPexRTC(config: PexRTCProcessorConfig): Promise<MediaCallPexipProcessor> {
		try {
			const pexRTC = await getPexRTC(config.nodeDomain);
			return new MediaCallPexipProcessor(config, pexRTC);
		} catch (err) {
			config.logger?.error('MediaCallPexipProcessor.initialization error', err);
			throw err;
		}
	}

	public setMuted(muted: boolean): void {
		if (this.stopped) {
			return;
		}

		this._muted = muted;
		this.pexRTC.muteAudio(muted);
		// this.streams.mainLocal.setAudioEnabled(!muted && !this._held);
	}

	public setHeld(held: boolean): void {
		if (this.stopped) {
			return;
		}

		this._held = held;
		// this.streams.mainLocal.setAudioEnabled(!held && !this._muted);
		// this.streams.mainRemote.setAudioEnabled(!held);
	}

	public stop(): void {
		this.config.logger?.debug('MediaCallPexipProcessor.stop');

		this.stopped = true;
		this.unregisterPexipEvents();

		try {
			this.pexRTC.disconnect();
		} catch (err) {
			this.config.logger?.error('MediaCallPexipProcessor.stop', err);
		}
	}

	public getInternalState<K extends keyof PexRTCInternalStateMap>(stateName: K): ServiceStateValue<PexRTCInternalStateMap, K> {
		switch (stateName) {
			case 'connection':
				return this._connectionState;
		}
	}

	private changeInternalState(stateName: keyof PexRTCInternalStateMap): void {
		this.config.logger?.debug('MediaCallPexipProcessor.changeInternalState', stateName);
		this.emitter.emit('internalStateChange', stateName);
	}

	protected registerPexipEvents() {
		const { pexRTC } = this;

		pexRTC.onSetup = (localStream) => this.handleSetup(localStream ?? null);
		pexRTC.onConnect = (remoteStream) => this.handleConnect(remoteStream ?? null);
		pexRTC.onDisconnect = (reason) => this.handleDisconnect(reason);
		pexRTC.onError = (error) => this.handleError(error);
		pexRTC.onPresentation = (presenting, presenter, uuid, presenterSource) =>
			this.handlePresentation(presenting, presenter, uuid, presenterSource);
		pexRTC.onPresentationConnected = (stream) => this.handlePresentationConnected(stream);
		pexRTC.onPresentationDisconnected = (reason) => this.handlePresentationDisconnected(reason);
		pexRTC.onScreenshareConnected = (stream) => this.handleScreenshareConnected(stream);
		pexRTC.onScreenshareStopped = (reason) => this.handleScreenshareStopped(reason);
	}

	private unregisterPexipEvents() {
		try {
			const { pexRTC } = this;

			pexRTC.onSetup = undefined;
			pexRTC.onConnect = undefined;
			pexRTC.onDisconnect = undefined;
			pexRTC.onError = undefined;
			pexRTC.onPresentation = undefined;
			pexRTC.onPresentationConnected = undefined;
			pexRTC.onPresentationDisconnected = undefined;
			pexRTC.onScreenshareConnected = undefined;
			pexRTC.onScreenshareStopped = undefined;
		} catch {
			// suppress exceptions here
		}
	}

	private handleSetup(localStream: MediaStream | null) {
		this.config.logger?.debug('MediaCallPexipProcessor.handleSetup', localStream?.id);
		this.loadLocalStream(localStream);
		this.connect();
	}

	private loadLocalStream(localStream: MediaStream | null) {
		this.streams.mainLocal.replaceDynamicStream(localStream);
	}

	private loadRemoteStream(remoteStream: MediaStream | null) {
		this.streams.mainRemote.replaceDynamicStream(remoteStream);
		// this.streams.screenShareRemote.replaceDynamicStream(remoteStream);
	}

	private handleConnect(remoteStream: MediaStream | null) {
		this.config.logger?.debug('MediaCallPexipProcessor.handleConnect');
		this.loadRemoteStream(remoteStream);
		this.setConnectionState('connected');
	}

	private handleDisconnect(_reason?: string) {
		this.config.logger?.debug('MediaCallPexipProcessor.handleDisconnect');
		this.setConnectionState('disconnected');
	}

	private handleError(error?: unknown) {
		this.config.logger?.debug('MediaCallPexipProcessor.handleError', error);
		this.setConnectionState('error');
		this.setError(error);
	}

	private handlePresentation(presenting: boolean, presenter: string, uuid: string, presenterSource: string) {
		this.config.logger?.debug('MediaCallPexipProcessor.handlePresentation', presenting, presenter, uuid, presenterSource);
		this.streams.screenShareRemote.setActive(Boolean(presenting));
		if (presenting) {
			this.pexRTC.getPresentation();
		}
		// if (!presenting) {
		// 	this.streams.screenShareRemote.replaceDynamicStream(null);
		// 	return;
		// }

		// this.streams.screenShareRemote.replaceDynamicStream();
	}

	private handlePresentationConnected(stream: MediaStream | string | null) {
		this.config.logger?.debug('MediaCallPexipProcessor.handlePresentationConnected', typeof stream === 'object' ? stream?.id : stream);

		if (stream && typeof stream !== 'string') {
			this.streams.screenShareRemote.replaceDynamicStream(stream);
			this.streams.screenShareRemote.setActive(true);
		} else {
			this.streams.screenShareRemote.replaceDynamicStream(null);
			this.streams.screenShareRemote.setActive(false);
		}
	}

	private handlePresentationDisconnected(reason?: string) {
		this.config.logger?.debug('MediaCallPexipProcessor.handlePresentationDisconnected', reason);
		this.streams.screenShareRemote.replaceDynamicStream(null);
		this.streams.screenShareRemote.setActive(false);
	}

	private handleScreenshareConnected(stream: MediaStream | null) {
		this.config.logger?.debug('MediaCallPexipProcessor.handleScreenshareConnected', typeof stream === 'object' ? stream?.id : stream);

		if (stream && typeof stream !== 'string') {
			this.streams.screenShareLocal.replaceDynamicStream(stream);
		} else {
			this.streams.screenShareLocal.replaceDynamicStream(null);
		}
		this.streams.screenShareLocal.setActive(Boolean(stream));
	}

	private handleScreenshareStopped(reason?: string) {
		this.config.logger?.debug('MediaCallPexipProcessor.handleScreenshareStopped', reason);
		this.streams.screenShareLocal.replaceDynamicStream(null);
		this.streams.screenShareLocal.setActive(false);
	}

	private setConnectionState(state: PexipConnectionState) {
		this.config.logger?.debug('MediaCallPexipProcessor.setConnectionState', state);
		if (state !== this._connectionState) {
			this._connectionState = state;
			this.changeInternalState('connection');
		}
	}

	private setError(error: unknown) {
		this._error = error;
	}

	public joinConference() {
		this.config.logger?.debug('MediaCallPexipProcessor.joinConference', this.config.conferenceAlias, this.config.displayName);
		console.log('joining PexRTC conference on ', this.config.conferenceAlias);

		this.setConnectionState('connecting');
		this.pexRTC.makeCall(this.config.nodeDomain, this.config.conferenceAlias, this.config.displayName);
	}

	private connect() {
		this.config.logger?.debug('MediaCallPexipProcessor.connect', this.config.pin);
		this.setConnectionState('joining');
		this.pexRTC.connect(this.config.pin ?? undefined);
	}

	public disconnect() {
		this.config.logger?.debug('MediaCallPexipProcessor.disconnect');
		this.pexRTC.disconnect();
		this.setConnectionState('disconnected');
	}

	public requestScreenShare(requested: boolean) {
		this.config.logger?.debug('MediaCallPexipProcessor.requestScreenShare', requested);
		this.pexRTC.present(requested ? 'screen' : null);
	}
}
