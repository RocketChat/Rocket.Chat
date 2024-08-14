import type { IMediaStreamRenderer, SignalingSocketEvents, VoipEvents } from '@rocket.chat/core-typings';
import { type VoIPUserConfiguration } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import type { InvitationAcceptOptions, Referral, Session, SessionInviteOptions } from 'sip.js';
import { Registerer, RequestPendingError, SessionState, UserAgent, Invitation, Inviter, RegistererState, UserAgentState } from 'sip.js';
import type { IncomingResponse, OutgoingByeRequest, URI } from 'sip.js/lib/core';
import type { SessionDescriptionHandlerOptions } from 'sip.js/lib/platform/web';
import { SessionDescriptionHandler } from 'sip.js/lib/platform/web';

import LocalStream from './LocalStream';
import RemoteStream from './RemoteStream';
import type { ContactInfo, VoiceCallSession } from './definitions';

export type VoiceCallEvents = Omit<VoipEvents, 'ringing' | 'callestablished' | 'incomingcall'> & {
	callestablished: ContactInfo;
	incomingcall: ContactInfo;
	outgoingcall: ContactInfo;
	dialer: { open: boolean };
};

type SessionError = {
	status: number | undefined;
	reason: string;
	contact: ContactInfo;
};

class VoIPClient extends Emitter<VoiceCallEvents> {
	protected registerer: Registerer | undefined;

	protected session: Session | undefined;

	public userAgent: UserAgent | undefined;

	public networkEmitter: Emitter<SignalingSocketEvents>;

	private mediaStreamRendered: IMediaStreamRenderer | undefined;

	private remoteStream: RemoteStream | undefined;

	private held = false;

	private muted = false;

	private online = true;

	private error: SessionError | null = null;

	constructor(private readonly config: VoIPUserConfiguration, mediaRenderer?: IMediaStreamRenderer) {
		super();

		this.mediaStreamRendered = mediaRenderer;

		this.networkEmitter = new Emitter<SignalingSocketEvents>();
	}

	public async init() {
		const { authPassword, authUserName, sipRegistrarHostnameOrIP, iceServers, webSocketURI } = this.config;

		const transportOptions = {
			server: webSocketURI,
			connectionTimeout: 100,
			keepAliveInterval: 20,
		};

		const sdpFactoryOptions = {
			iceGatheringTimeout: 10,
			peerConnectionConfiguration: { iceServers },
		};

		this.userAgent = new UserAgent({
			authorizationPassword: authPassword,
			authorizationUsername: authUserName,
			uri: UserAgent.makeURI(`sip:${authUserName}@${sipRegistrarHostnameOrIP}`),
			transportOptions,
			sessionDescriptionHandlerFactoryOptions: sdpFactoryOptions,
			logConfiguration: false,
			logLevel: 'error',
			delegate: {
				onInvite: this.onIncomingCall,
				onRefer: this.onTransferedCall,
			},
		});

		this.userAgent.transport.isConnected();

		try {
			this.registerer = new Registerer(this.userAgent);

			this.userAgent.transport.onConnect = this.onUserAgentConnected;
			this.userAgent.transport.onDisconnect = this.onUserAgentDisconnected;

			await this.userAgent.start();

			window.addEventListener('online', this.onNetworkRestored);
			window.addEventListener('offline', this.onNetworkLost);
		} catch (error) {
			throw error;
		}
	}

	static async create(config: VoIPUserConfiguration, mediaRenderer?: IMediaStreamRenderer): Promise<VoIPClient> {
		const voip = new VoIPClient(config, mediaRenderer);
		await voip.init();
		return voip;
	}

	protected initSession(session: Session): void {
		this.session = session;

		this.session?.stateChange.addListener((state: SessionState) => {
			if (this.session !== session) {
				return; // if our session has changed, just return
			}

			const sessionEvents: Record<SessionState, () => void> = {
				[SessionState.Initial]: () => undefined, // noop
				[SessionState.Establishing]: this.onSessionStablishing,
				[SessionState.Established]: this.onSessionStablished,
				[SessionState.Terminating]: this.onSessionTerminated,
				[SessionState.Terminated]: this.onSessionTerminated,
			} as const;

			const event = sessionEvents[state];

			if (!event) {
				throw new Error('Unknown session state.');
			}

			event();
		});
	}

	public register = async (): Promise<void> => {
		await this.registerer?.register({
			requestDelegate: {
				onAccept: this.onRegistrationAccepted,
				onReject: this.onRegistrationRejected,
			},
		});
	};

	public unregister = async (): Promise<void> => {
		await this.registerer?.unregister({
			all: true,
			requestDelegate: {
				onAccept: this.onUnregistrationAccepted,
				onReject: this.onUnregistrationRejected,
			},
		});
	};

	public call = async (calleeURI: string, mediaRenderer?: IMediaStreamRenderer): Promise<void> => {
		if (!calleeURI) {
			throw new Error('Invalid URI');
		}

		if (this.session) {
			throw new Error('Session already exists');
		}

		if (!this.userAgent) {
			throw new Error('No User Agent.');
		}

		if (mediaRenderer) {
			this.switchMediaRenderer(mediaRenderer);
		}

		const target = this.makeURI(calleeURI);

		if (!target) {
			throw new Error(`Failed to create valid URI ${calleeURI}`);
		}

		const inviter = new Inviter(this.userAgent, target, {
			sessionDescriptionHandlerOptions: {
				constraints: {
					audio: true,
					video: false,
				},
			},
		});

		await this.sendInvite(inviter);
	};

	public transfer = async (calleeURI: string): Promise<void> => {
		if (!calleeURI) {
			throw new Error('Invalid URI');
		}

		if (!this.session) {
			throw new Error('No active call');
		}

		if (!this.userAgent) {
			throw new Error('No User Agent.');
		}

		const target = this.makeURI(calleeURI);

		if (!target) {
			throw new Error(`Failed to create valid URI ${calleeURI}`);
		}

		await this.session.refer(target);
	};

	public answer = (): Promise<void> => {
		if (!(this.session instanceof Invitation)) {
			throw new Error('Session not instance of Invitation.');
		}

		const invitationAcceptOptions: InvitationAcceptOptions = {
			sessionDescriptionHandlerOptions: {
				constraints: {
					audio: true,
					video: false,
				},
			},
		};

		return this.session.accept(invitationAcceptOptions);
	};

	public reject = (): Promise<void> => {
		if (!this.session) {
			return Promise.reject(new Error('No active call.'));
		}

		if (!(this.session instanceof Invitation)) {
			return Promise.reject(new Error('Session not instance of Invitation.'));
		}

		return this.session.reject();
	};

	public endCall = async (): Promise<OutgoingByeRequest | void> => {
		if (!this.session) {
			return Promise.reject(new Error('No active call.'));
		}

		switch (this.session.state) {
			case SessionState.Initial:
			case SessionState.Establishing:
				if (this.session instanceof Inviter) {
					return this.session.cancel();
				}

				if (this.session instanceof Invitation) {
					return this.session.reject();
				}

				throw new Error('Unknown session type.');
			case SessionState.Established:
				return this.session.bye();
			case SessionState.Terminating:
			case SessionState.Terminated:
				break;
			default:
				throw new Error('Unknown state');
		}

		return Promise.resolve();
	};

	public setMute = async (mute: boolean): Promise<void> => {
		if (this.muted === mute) {
			return Promise.resolve();
		}

		if (!this.session) {
			throw new Error('No active call.');
		}

		const { peerConnection } = this.sessionDescriptionHandler;

		if (!peerConnection) {
			throw new Error('Peer connection closed.');
		}

		try {
			const options: SessionInviteOptions = {
				requestDelegate: {
					onAccept: (): void => {
						this.muted = mute;
						this.toggleMediaStreamTracks('sender', !this.muted);
						this.toggleMediaStreamTracks('receiver', !this.muted);
						this.emit('stateChanged');
					},
					onReject: (): void => {
						this.toggleMediaStreamTracks('sender', !this.muted);
						this.toggleMediaStreamTracks('receiver', !this.muted);
						this.emit('muteerror');
					},
				},
			};

			await this.session.invite(options);

			this.toggleMediaStreamTracks('sender', !this.muted);
			this.toggleMediaStreamTracks('receiver', !this.muted);
		} catch (error) {
			if (error instanceof RequestPendingError) {
				console.error(`[${this.session?.id}] A mute request is already in progress.`);
			}

			this.emit('muteerror');
			throw error;
		}
	};

	public setHold = async (hold: boolean): Promise<void> => {
		if (this.held === hold) {
			return Promise.resolve();
		}

		if (!this.session) {
			throw new Error('Session not found');
		}

		const { sessionDescriptionHandler } = this;

		const sessionDescriptionHandlerOptions = this.session.sessionDescriptionHandlerOptionsReInvite as SessionDescriptionHandlerOptions;
		sessionDescriptionHandlerOptions.hold = hold;
		this.session.sessionDescriptionHandlerOptionsReInvite = sessionDescriptionHandlerOptions;

		const { peerConnection } = sessionDescriptionHandler;

		if (!peerConnection) {
			throw new Error('Peer connection closed.');
		}

		try {
			const options: SessionInviteOptions = {
				requestDelegate: {
					onAccept: (): void => {
						this.held = hold;

						this.toggleMediaStreamTracks('receiver', !this.held);
						this.toggleMediaStreamTracks('sender', !this.held);

						this.held ? this.emit('hold') : this.emit('unhold');
						this.emit('stateChanged');
					},
					onReject: (): void => {
						this.toggleMediaStreamTracks('receiver', !this.held);
						this.toggleMediaStreamTracks('sender', !this.held);
						this.emit('holderror');
					},
				},
			};

			await this.session.invite(options);

			this.toggleMediaStreamTracks('receiver', !hold);
			this.toggleMediaStreamTracks('sender', !hold);
		} catch (error: unknown) {
			if (error instanceof RequestPendingError) {
				console.error(`[${this.session?.id}] A hold request is already in progress.`);
			}

			this.emit('holderror');
			throw error;
		}
	};

	public sendDTMF = (tone: string): Promise<void> => {
		// Validate tone
		if (!tone || !/^[0-9A-D#*,]$/.exec(tone)) {
			return Promise.reject(new Error('Invalid DTMF tone.'));
		}

		if (!this.session) {
			return Promise.reject(new Error('Session does not exist.'));
		}

		const dtmf = tone;
		const duration = 2000;
		const body = {
			contentDisposition: 'render',
			contentType: 'application/dtmf-relay',
			content: `Signal=${dtmf}\r\nDuration=${duration}`,
		};
		const requestOptions = { body };

		return this.session.info({ requestOptions }).then(() => undefined);
	};

	private async attemptReconnection(reconnectionAttempt = 0, checkRegistration = false): Promise<void> {
		const { connectionRetryCount } = this.config;

		if (!this.userAgent) {
			return;
		}

		if (connectionRetryCount !== -1 && reconnectionAttempt > connectionRetryCount) {
			return;
		}

		const reconnectionDelay = Math.pow(2, reconnectionAttempt % 4);

		console.error(`Attempting to reconnect with backoff due to network loss. Backoff time [${reconnectionDelay}]`);
		setTimeout(() => {
			this.userAgent?.reconnect().catch(() => {
				this.attemptReconnection(++reconnectionAttempt, checkRegistration);
			});
		}, reconnectionDelay * 1000);
	}

	public async changeAudioInputDevice(constraints: MediaStreamConstraints): Promise<boolean> {
		if (!this.session) {
			console.warn('changeAudioInputDevice() : No session.');
			return false;
		}

		const newStream = await LocalStream.requestNewStream(constraints, this.session);

		if (!newStream) {
			console.warn('changeAudioInputDevice() : Unable to get local stream.');
			return false;
		}

		const { peerConnection } = this.sessionDescriptionHandler;

		if (!peerConnection) {
			console.warn('changeAudioInputDevice() : No peer connection.');
			return false;
		}

		LocalStream.replaceTrack(peerConnection, newStream, 'audio');
		return true;
	}

	public switchMediaRenderer(mediaRenderer: IMediaStreamRenderer): void {
		if (!this.remoteStream) {
			return;
		}

		this.mediaStreamRendered = mediaRenderer;
		this.remoteStream.init(mediaRenderer.remoteMediaElement);
		this.remoteStream.play();
	}

	public getContactInfo() {
		if (this.error) {
			return this.error.contact;
		}

		if (!(this.session instanceof Invitation) && !(this.session instanceof Inviter)) {
			return null;
		}

		const { remoteIdentity } = this.session;
		return {
			id: remoteIdentity.uri.user ?? '',
			name: remoteIdentity.displayName,
			host: remoteIdentity.uri.host,
		};
	}

	public getReferredBy() {
		if (!(this.session instanceof Invitation)) {
			return null;
		}

		const referredBy = this.session.request.getHeader('Referred-By');

		if (!referredBy) {
			return null;
		}

		const uri = UserAgent.makeURI(referredBy.slice(1, -1));

		if (!uri) {
			return null;
		}

		return {
			id: uri.user ?? '',
			host: uri.host,
		};
	}

	public isRegistered(): boolean {
		return this.registerer?.state === RegistererState.Registered;
	}

	public isReady(): boolean {
		return this.userAgent?.state === UserAgentState.Started;
	}

	public isCaller(): boolean {
		return this.session instanceof Inviter;
	}

	public isCallee(): boolean {
		return this.session instanceof Invitation;
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

	public isError(): boolean {
		return !!this.error;
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

	public getSessionType(): VoiceCallSession['type'] | null {
		if (this.error) {
			return 'ERROR';
		}

		if (this.session?.state === SessionState.Established) {
			return 'ONGOING';
		}

		if (this.session instanceof Invitation) {
			return 'INCOMING';
		}

		if (this.session instanceof Inviter) {
			return 'OUTGOING';
		}

		return null;
	}

	public getSession(): VoiceCallSession | null {
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
			isError: this.isError(),
		};
	}

	public notifyDialer(value: { open: boolean }) {
		this.emit('dialer', value);
	}

	public clear(): void {
		this.userAgent?.stop();
		this.registerer?.dispose();

		if (this.userAgent) {
			this.userAgent.transport.onConnect = undefined;
			this.userAgent.transport.onDisconnect = undefined;
			window.removeEventListener('online', this.onNetworkRestored);
			window.removeEventListener('offline', this.onNetworkLost);
		}
	}

	private setupRemoteMedia() {
		const { remoteMediaStream } = this.sessionDescriptionHandler;

		this.remoteStream = new RemoteStream(remoteMediaStream);
		const mediaElement = this.mediaStreamRendered?.remoteMediaElement;

		if (mediaElement) {
			this.remoteStream.init(mediaElement);
			this.remoteStream.play();
		}
	}

	private makeURI(calleeURI: string): URI | undefined {
		const hasPlusChar = calleeURI.includes('+');
		return UserAgent.makeURI(`sip:${hasPlusChar ? '*' : ''}${calleeURI}@${this.config.sipRegistrarHostnameOrIP}`);
	}

	private toggleMediaStreamTracks(type: 'sender' | 'receiver', enable: boolean): void {
		const { peerConnection } = this.sessionDescriptionHandler;

		if (!peerConnection) {
			throw new Error('Peer connection closed.');
		}

		const tracks = type === 'sender' ? peerConnection.getSenders() : peerConnection.getReceivers();

		tracks?.forEach((sender) => {
			if (sender.track) {
				sender.track.enabled = enable;
			}
		});
	}

	private async sendInvite(inviter: Inviter): Promise<void> {
		this.initSession(inviter);

		await inviter.invite({
			requestDelegate: {
				onReject: this.onInviteRejected,
			},
		});

		this.emit('stateChanged');
	}

	private get sessionDescriptionHandler(): SessionDescriptionHandler {
		if (!this.session) {
			throw new Error('No active call.');
		}

		const { sessionDescriptionHandler } = this.session;

		if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
			throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
		}

		return sessionDescriptionHandler;
	}

	private setError(error: SessionError | null) {
		this.error = error;
		this.emit('stateChanged');
	}

	private onUserAgentConnected = (): void => {
		this.networkEmitter.emit('connected');
		this.emit('stateChanged');
	};

	private onUserAgentDisconnected = (error: any): void => {
		this.networkEmitter.emit('disconnected');
		this.emit('stateChanged');

		if (error) {
			this.networkEmitter.emit('connectionerror', error);
			this.attemptReconnection();
		}
	};

	private onRegistrationAccepted = (): void => {
		this.emit('registered');
		this.emit('stateChanged');
	};

	private onRegistrationRejected = (error: any): void => {
		this.emit('registrationerror', error);
	};

	private onUnregistrationAccepted = (): void => {
		this.emit('unregistered');
		this.emit('stateChanged');
	};

	private onUnregistrationRejected = (error: any): void => {
		this.emit('unregistrationerror', error);
	};

	private onIncomingCall = async (invitation: Invitation): Promise<void> => {
		if (!this.isRegistered() || this.session) {
			await invitation.reject();
			return;
		}

		this.initSession(invitation);

		this.emit('incomingcall', this.getContactInfo() as ContactInfo);
		this.emit('stateChanged');
	};

	private onTransferedCall = async (referral: Referral) => {
		await referral.accept();
		this.sendInvite(referral.makeInviter());
	};

	private onSessionStablishing = (): void => {
		this.emit('outgoingcall', this.getContactInfo() as ContactInfo);
	};

	private onSessionStablished = (): void => {
		this.setupRemoteMedia();
		this.emit('callestablished', this.getContactInfo() as ContactInfo);
		this.emit('stateChanged');
	};

	private onInviteRejected = (response: IncomingResponse): void => {
		const { statusCode, reasonPhrase, to } = response.message;

		if (!reasonPhrase) {
			return;
		}

		this.setError({
			status: statusCode,
			reason: reasonPhrase,
			contact: { id: to.uri.user ?? '', host: to.uri.host },
		});

		this.emit('callfailed', response.message.reasonPhrase || 'unknown');
	};

	private onSessionTerminated = (): void => {
		this.session = undefined;
		this.muted = false;
		this.held = false;
		this.remoteStream?.clear();
		this.emit('callterminated');
		this.emit('stateChanged');
	};

	private onNetworkRestored = (): void => {
		this.online = true;
		this.networkEmitter.emit('localnetworkonline');
		this.emit('stateChanged');

		this.attemptReconnection();
	};

	private onNetworkLost = (): void => {
		this.online = false;
		this.networkEmitter.emit('localnetworkoffline');
		this.emit('stateChanged');
	};
}

export default VoIPClient;
