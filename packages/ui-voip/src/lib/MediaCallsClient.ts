import type { SignalingSocketEvents, VoipEvents as CoreVoipEvents, IUser, IMediaCall } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { IClientMediaCall, MediaSignal, MediaSignalingSession, MediaCallWebRTCProcessor } from '@rocket.chat/media-signaling';

import type { ContactInfo, VoipSession } from '../definitions';
import RemoteStream from './RemoteStream';
import { getUserMedia } from './getUserMedia';

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

export type MediaCallsCallee = {
	identifier: string;
	identifierKind: 'user' | 'room' | 'extension';
};

export type MediaCallsClientConfig = {
	userId: IUser['_id'];
	startCallFn: (params: { sessionId: string } & MediaCallsCallee) => Promise<IMediaCall>;
	sendSignalFn: (signal: MediaSignal) => void;
};

class MediaCallsClient extends Emitter<VoipEvents> {
	public networkEmitter: Emitter<SignalingSocketEvents>;

	private audioElement: HTMLAudioElement | null = null;

	private remoteStream: RemoteStream | undefined;

	private held = false;

	private muted = false;

	private online = true;

	private error: SessionError | null = null;

	private reconnecting = false;

	private startingNewCall = false;

	private session: MediaSignalingSession;

	constructor(private readonly config: MediaCallsClientConfig) {
		super();

		this.session = new MediaSignalingSession({
			userId: config.userId,
			transport: (signal: MediaSignal) => config.sendSignalFn(signal),
			processorFactories: {
				webrtc: (config) => new MediaCallWebRTCProcessor(config),
			},
			mediaStreamFactory: getUserMedia,
		});

		this.networkEmitter = new Emitter<SignalingSocketEvents>();

		this.session.on('newCall', ({ call }) => this.onNewCall(call));
		this.session.on('acceptedCall', ({ call }) => this.onAcceptedCall(call));
		this.session.on('endedCall', ({ call }) => this.onEndedCall(call));
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
		return this.startingNewCall || this.session.isBusy();
	}

	public async processSignal(signal: MediaSignal): Promise<void> {
		return this.session.processSignal(signal);
	}

	public async call(callee: MediaCallsCallee): Promise<void> {
		console.log('MediaCallsClient.call', callee);

		if (this.isBusy()) {
			throw new Error('Session already exists');
		}

		await this.startCall(callee);
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
		console.log('answer');
		const call = this.session.getMainCall();
		if (!call) {
			throw new Error('No call available to answer');
		}

		return call.accept();
	}

	public async reject(): Promise<void> {
		console.log('reject');

		const call = this.session.getMainCall();
		if (!call) {
			throw new Error('No call available to reject');
		}

		return call.reject();
	}

	public async endCall(): Promise<void> {
		console.log('endCall');

		const call = this.session.getMainCall();
		if (!call) {
			throw new Error('No call available to hangup');
		}

		return call.hangup();
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
		console.log('changeAudioInputDevice');

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
		console.log('switchAudioElement');

		this.audioElement = audioElement;

		if (this.remoteStream) {
			this.playRemoteStream();
		}
	}

	public getContactInfo(): ContactInfo | null {
		if (this.error) {
			return this.error.contact;
		}

		const call = this.session.getMainCall();
		if (!call) {
			return {
				id: 'none',
				name: 'Nobody',
				host: '',
			};
		}

		return (
			this.getCallContactInfo(call) || {
				id: 'unknown',
				name: 'Unknown',
				host: '',
			}
		);
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
		return this.session.getMainCall()?.role === 'caller';
	}

	public isCallee(): boolean {
		return this.session.getMainCall()?.role === 'callee';
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
		const call = this.session.getMainCall();
		if (!call) {
			return null;
		}

		// if (call.state === 'error') {
		// 	return 'ERROR';
		// }
		if (['active', 'accepted'].includes(call.state)) {
			return 'ONGOING';
		}
		if (call.state === 'hangup') {
			return null;
		}

		if (['none', 'ringing'].includes(call.state)) {
			if (call.role === 'callee') {
				return 'INCOMING';
			}
			if (call.role === 'caller') {
				return 'OUTGOING';
			}
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
					mute: (mute) => this.setMute(mute ?? true),
					hold: (hold) => this.setHold(hold ?? true),
					accept: () => this.answer(),
					end: () => this.endCall(),
					dtmf: (tone) => this.sendDTMF(tone),
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

	private onNewCall(call: IClientMediaCall): void {
		console.log('onNewCall');
		const contact = this.getCallContactInfo(call) as ContactInfo;

		if (call.role === 'callee') {
			this.emit('incomingcall', contact);
		} else if (call.role === 'caller') {
			this.emit('outgoingcall', contact);
		}
		this.emit('stateChanged');
	}

	private onAcceptedCall(call: IClientMediaCall): void {
		console.log('onAcceptedCall');

		const remoteMediaStream = call.getRemoteMediaStream();
		this.remoteStream = new RemoteStream(remoteMediaStream);
		this.playRemoteStream();

		const contact = this.getCallContactInfo(call) as ContactInfo;
		this.emit('callestablished', contact);
		this.emit('stateChanged');
	}

	private onEndedCall(_call: IClientMediaCall): void {
		console.log('onEndedCall');

		this.remoteStream?.clear();
		this.emit('callterminated');
		this.emit('stateChanged');
	}

	private getCallContactInfo(call: IClientMediaCall): ContactInfo | null {
		if (this.error) {
			return this.error.contact;
		}

		const { contact: contactData } = call;
		if (!contactData) {
			return null;
		}

		return {
			id: contactData.id,
			name: contactData.displayName,
			host: '',
		};
	}

	// private setContactInfo(contact: ContactInfo) {
	// 	this.contactInfo = contact;
	// 	this.emit('stateChanged');
	// }

	private async startCall(target: MediaCallsCallee): Promise<void> {
		console.log('startCall');
		this.startingNewCall = true;
		try {
			this.emit('stateChanged');

			const call = await this.config.startCallFn({ sessionId: this.session.sessionId, ...target });

			console.log('startCall', call);
			const { _id: callId, callee } = call;
			await this.session.registerOutboundCall(callId, callee);

			this.emit('stateChanged');
		} finally {
			this.startingNewCall = false;
		}
	}

	private playRemoteStream() {
		console.log('playRemoteStream');

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
