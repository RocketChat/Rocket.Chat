import type { SignalingSocketEvents, VoipEvents as CoreVoipEvents, IUser, IRoom, IMediaCall } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { IClientMediaCall, MediaSignal, MediaSignalingSession } from '@rocket.chat/media-signaling';

import type { ContactInfo, VoipSession } from '../definitions';
import RemoteStream from './RemoteStream';

export type VoipEvents = Omit<CoreVoipEvents, 'ringing' | 'callestablished' | 'incomingcall'> & {
	callestablished: ContactInfo;
	incomingcall: ContactInfo;
	outgoingcall: ContactInfo;
	dialer: { open: boolean };
	incomingcallerror: string;
};

type SessionError = {
	status: number | undefined;
	reason: string;
	contact: ContactInfo;
};

export type MediaCallsClientConfig = {
	userId: IUser['_id'];
	startCallFn: (params: { roomId: string; sessionId: string }) => Promise<IMediaCall>;
	sendSignalFn: (signal: MediaSignal) => Promise<void>;
};

export type MediaCallsCallee = { uid?: IUser['_id']; rid?: IRoom['_id']; extension?: string };

class MediaCallsClient extends MediaSignalingSession<VoipEvents> {
	public networkEmitter: Emitter<SignalingSocketEvents>;

	private audioElement: HTMLAudioElement | null = null;

	private remoteStream: RemoteStream | undefined;

	private held = false;

	private muted = false;

	private online = true;

	private error: SessionError | null = null;

	private reconnecting = false;

	private startingNewCall = false;

	constructor(private readonly config: MediaCallsClientConfig) {
		super(config.userId);

		this.networkEmitter = new Emitter<SignalingSocketEvents>();
	}

	public async init() {
		window.addEventListener('online', this.onNetworkRestored);
		window.addEventListener('offline', this.onNetworkLost);
	}

	static async create(config: MediaCallsClientConfig): Promise<MediaCallsClient> {
		const mediaCalls = new MediaCallsClient(config);
		// await mediaCalls.init();
		return mediaCalls;
	}

	public isBusy(): boolean {
		return this.startingNewCall || super.isBusy();
	}

	public async call(callee: MediaCallsCallee): Promise<void> {
		console.log('MediaCallsClient.call', callee);
		if (!callee.rid) {
			if (callee.uid || callee.extension) {
				throw new Error('not-implemented');
			}
			throw new Error('Invalid Callee');
		}

		if (this.isBusy()) {
			throw new Error('Session already exists');
		}

		await this.startCall(callee.rid);
	}

	public async transfer(calleeURI: string): Promise<void> {
		if (!calleeURI) {
			throw new Error('Invalid URI');
		}

		if (!this.isBusy()) {
			throw new Error('No active call');
		}

		// #ToDo
	}

	public async answer(): Promise<void> {
		//
	}

	public async reject(): Promise<void> {
		//
	}

	public async endCall(): Promise<void> {
		//
	}

	public async setMute(_mute: boolean): Promise<void> {
		//
	}

	public async setHold(_hold: boolean): Promise<void> {
		//
	}

	public async sendDTMF(_tone: string): Promise<void> {
		//
	}

	public async changeAudioInputDevice(_constraints: MediaStreamConstraints): Promise<boolean> {
		return true;
		// if (!this.isBusy()) {
		// 	console.warn('changeAudioInputDevice() : No session.');
		// 	return false;
		// }
		// const newStream = await LocalStream.requestNewStream(constraints, this.session);
		// if (!newStream) {
		// 	console.warn('changeAudioInputDevice() : Unable to get local stream.');
		// 	return false;
		// }
		// const { peerConnection } = this.sessionDescriptionHandler;
		// if (!peerConnection) {
		// 	console.warn('changeAudioInputDevice() : No peer connection.');
		// 	return false;
		// }
		// LocalStream.replaceTrack(peerConnection, newStream, 'audio');
		// return true;
	}

	public switchAudioElement(audioElement: HTMLAudioElement | null): void {
		this.audioElement = audioElement;

		if (this.remoteStream) {
			this.playRemoteStream();
		}
	}

	public getContactInfo(): ContactInfo | null {
		if (this.error) {
			return this.error.contact;
		}

		const call = this.getMainCall();
		if (!call) {
			return null;
		}

		const contactData = this.getStoredCallContact(call.callId);
		return {
			id: contactData.id,
			name: contactData.displayName,
			host: '',
		};
	}

	public getReferredBy() {
		return null;
		// if (!(this.session instanceof Invitation)) {
		// 	return null;
		// }
		//
		// const referredBy = this.session.request.getHeader('Referred-By');
		//
		// if (!referredBy) {
		// 	return null;
		// }
		//
		// const uri = UserAgent.makeURI(referredBy.slice(1, -1));
		//
		// if (!uri) {
		// 	return null;
		// }
		//
		// return {
		// 	id: uri.user ?? '',
		// 	host: uri.host,
		// };
	}

	public isRegistered(): boolean {
		return true;
	}

	public isReady(): boolean {
		return true;
	}

	public isCaller(): boolean {
		return this.getMainCall()?.role === 'caller';
	}

	public isCallee(): boolean {
		return this.getMainCall()?.role === 'callee';
	}

	public isIncoming(): boolean {
		return this.getSessionType() === 'INCOMING';
	}

	public isOngoing(): boolean {
		return this.getSessionType() === 'ONGOING';
	}

	public isOutgoing(): boolean {
		return this.getSessionType() === 'OUTGOING';
	}

	public isInCall(): boolean {
		return this.getSessionType() !== null;
	}

	public isError(): boolean {
		return !!this.error;
	}

	public isReconnecting(): boolean {
		return this.reconnecting;
	}

	public isOnline(): boolean {
		return this.online;
	}

	public isMuted(): boolean {
		return this.muted;
	}

	public isHeld(): boolean {
		return this.held;
	}

	public getError() {
		return this.error ?? null;
	}

	public clearErrors = (): void => {
		this.setError(null);
	};

	public getSessionType(): VoipSession['type'] | null {
		const call = this.getMainCall();
		if (!call) {
			return null;
		}

		if (call.state === 'error') {
			return 'ERROR';
		}
		if (call.state === 'active') {
			return 'ONGOING';
		}
		if (call.role === 'callee') {
			return 'INCOMING';
		}
		if (call.role === 'caller') {
			return 'OUTGOING';
		}

		return null;
	}

	public getSession(): VoipSession | null {
		const type = this.getSessionType();

		switch (type) {
			case 'ERROR': {
				const { contact, ...error } = this.getError() as SessionError;
				return {
					type: 'ERROR',
					error,
					contact,
					end: this.clearErrors,
				};
			}
			case 'INCOMING':
			case 'ONGOING':
			case 'OUTGOING':
				return {
					type,
					contact: this.getContactInfo() as ContactInfo,
					transferedBy: this.getReferredBy(),
					isMuted: this.isMuted(),
					isHeld: this.isHeld(),
					mute: this.setMute,
					hold: this.setHold,
					accept: this.answer,
					end: this.endCall,
					dtmf: this.sendDTMF,
				};
			default:
				return null;
		}
	}

	public getState() {
		return {
			isRegistered: this.isRegistered(),
			isReady: this.isReady(),
			isOnline: this.isOnline(),
			isIncoming: this.isIncoming(),
			isOngoing: this.isOngoing(),
			isOutgoing: this.isOutgoing(),
			isInCall: this.isBusy(),
			isError: this.isError(),
			isReconnecting: this.isReconnecting(),
		};
	}

	public getAudioElement(): HTMLAudioElement | null {
		return this.audioElement;
	}

	public notifyDialer(value: { open: boolean }) {
		this.emit('dialer', value);
	}

	public clear(): void {
		// window.removeEventListener('online', this.onNetworkRestored);
		// window.removeEventListener('offline', this.onNetworkLost);
	}

	protected callStateChanged(callId: string, state: IClientMediaCall['state']): void {
		super.callStateChanged(callId, state);

		const call = this.getCallData(callId);
		if (!call) {
			this.emit('stateChanged');
			return;
		}

		if (call.role === 'callee') {
			this.emit('incomingcall', this.getContactInfo() as ContactInfo);
		} else if (call.role === 'caller') {
			this.emit('outgoingcall', this.getContactInfo() as ContactInfo);
		}
		this.emit('stateChanged');
	}

	// private setContactInfo(contact: ContactInfo) {
	// 	this.contactInfo = contact;
	// 	this.emit('stateChanged');
	// }

	private async startCall(roomId: IRoom['_id']): Promise<void> {
		this.startingNewCall = true;
		try {
			this.emit('stateChanged');

			const call = await this.config.startCallFn({ roomId, sessionId: this.sessionId });

			console.log(call);
			const { _id: callId, callee } = call;
			this.setCallContact(callId, callee);

			this.emit('stateChanged');
		} finally {
			this.startingNewCall = false;
		}
	}

	protected async sendSignal(signal: MediaSignal): Promise<void> {
		return this.config.sendSignalFn(signal);
	}

	// private setupRemoteMedia() {
	// 	// const { remoteMediaStream } = this.sessionDescriptionHandler;

	// 	// this.remoteStream = new RemoteStream(remoteMediaStream);
	// 	this.playRemoteStream();
	// }

	private playRemoteStream() {
		if (!this.remoteStream) {
			console.warn(`Attempted to play missing remote media.`);
			return;
		}

		if (!this.audioElement) {
			console.error('Unable to play remote media: VoIPClient is missing an AudioElement reference to play it on.');
			return;
		}

		this.remoteStream.init(this.audioElement);
		this.remoteStream.play();
	}

	// private toggleMediaStreamTracks(type: 'sender' | 'receiver', enable: boolean): void {
	// 	console.log('toggleMediaStreamTracks', type, enable);
	// 	// const { peerConnection } = this.sessionDescriptionHandler;

	// 	// if (!peerConnection) {
	// 	// 	throw new Error('Peer connection closed.');
	// 	// }

	// 	// const tracks = type === 'sender' ? peerConnection.getSenders() : peerConnection.getReceivers();

	// 	// tracks?.forEach((sender) => {
	// 	// 	if (sender.track) {
	// 	// 		sender.track.enabled = enable;
	// 	// 	}
	// 	// });
	// }

	// private onInvitationCancel(): void {
	// 	// const reason = getMainInviteRejectionReason(invitation, message);
	// 	// if (reason) {
	// 	// 	this.emit('incomingcallerror', reason);
	// 	// }
	// }

	// private async onIncomingCall(): Promise<void> {
	// 	// #ToDo: incoming call

	// 	this.emit('incomingcall', this.getContactInfo() as ContactInfo);
	// 	this.emit('stateChanged');
	// }

	// private async onTransferedCall() {
	// 	// await referral.accept();
	// 	// this.sendInvite(referral.makeInviter());
	// }

	// private async onMessageReceived(): Promise<void> {
	// 	// #ToDo: contact update messages
	// }

	// private onSessionStablishing(): void {
	// 	this.emit('outgoingcall', this.getContactInfo() as ContactInfo);
	// }

	// private onSessionStablished(): void {
	// 	this.setupRemoteMedia();
	// 	this.emit('callestablished', this.getContactInfo() as ContactInfo);
	// 	this.emit('stateChanged');
	// }

	// private onInviteRejected(response: IncomingResponse): void {
	// 	const { statusCode, reasonPhrase, to } = response.message;

	// 	if (!reasonPhrase || statusCode === 487) {
	// 		return;
	// 	}

	// 	this.setError({
	// 		status: statusCode,
	// 		reason: reasonPhrase,
	// 		contact: { id: to.uri.user ?? '', host: to.uri.host },
	// 	});

	// 	this.emit('callfailed', response.message.reasonPhrase || 'unknown');
	// }

	// private onSessionTerminated(): void {
	// 	this.muted = false;
	// 	this.held = false;
	// 	this.remoteStream?.clear();
	// 	this.emit('callterminated');
	// 	this.emit('stateChanged');
	// }

	private onNetworkRestored(): void {
		this.online = true;
		this.networkEmitter.emit('localnetworkonline');
		this.emit('stateChanged');

		// this.attemptReconnection();
	}

	private onNetworkLost(): void {
		this.online = false;
		this.networkEmitter.emit('localnetworkoffline');
		this.emit('stateChanged');
	}

	private setError(error: SessionError | null) {
		console.error(error);
		this.error = error;
		this.emit('stateChanged');
	}
}

export default MediaCallsClient;
