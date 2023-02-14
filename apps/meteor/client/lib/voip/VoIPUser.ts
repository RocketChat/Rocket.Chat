/**
 * Class representing SIP UserAgent
 * @remarks
 * This class encapsulates all the details of sip.js and exposes
 * a very simple functions and callback handlers to the outside world.
 * This class thus abstracts user from Browser specific media details as well as
 * SIP specific protocol details.
 */
import type {
	CallStates,
	ConnectionState,
	ICallerInfo,
	IQueueMembershipSubscription,
	SignalingSocketEvents,
	SocketEventKeys,
	IMediaStreamRenderer,
	VoIPUserConfiguration,
	VoIpCallerInfo,
	IState,
	VoipEvents,
} from '@rocket.chat/core-typings';
import { Operation, UserState, WorkflowTypes } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import type { UserAgentOptions, InvitationAcceptOptions, Session, SessionInviteOptions } from 'sip.js';
import { UserAgent, Invitation, SessionState, Registerer, RequestPendingError, Inviter } from 'sip.js';
import type { OutgoingByeRequest, OutgoingRequestDelegate } from 'sip.js/lib/core';
import { URI } from 'sip.js/lib/core';
import type { SessionDescriptionHandlerOptions } from 'sip.js/lib/platform/web';
import { SessionDescriptionHandler } from 'sip.js/lib/platform/web';

import { toggleMediaStreamTracks } from './Helper';
import LocalStream from './LocalStream';
import { QueueAggregator } from './QueueAggregator';
import RemoteStream from './RemoteStream';

export class VoIPUser extends Emitter<VoipEvents> {
	state: IState = {
		isReady: false,
		enableVideo: false,
	};

	private remoteStream: RemoteStream | undefined;

	userAgentOptions: UserAgentOptions = {};

	userAgent: UserAgent | undefined;

	registerer: Registerer | undefined;

	mediaStreamRendered?: IMediaStreamRenderer;

	private _connectionState: ConnectionState = 'INITIAL';

	private _held = false;

	private mode: WorkflowTypes;

	private queueInfo: QueueAggregator;

	private connectionRetryCount;

	private stop;

	private networkEmitter: Emitter<SignalingSocketEvents>;

	private offlineNetworkHandler: () => void;

	private onlineNetworkHandler: () => void;

	private optionsKeepaliveInterval = 5;

	private optionsKeepAliveDebounceTimeInSec = 5;

	private attemptRegistration = false;

	protected session: Session | undefined;

	protected _callState: CallStates = 'INITIAL';

	protected _callerInfo: ICallerInfo | undefined;

	protected _userState: UserState = UserState.IDLE;

	protected _opInProgress: Operation = Operation.OP_NONE;

	get operationInProgress(): Operation {
		return this._opInProgress;
	}

	get userState(): UserState | undefined {
		return this._userState;
	}

	constructor(private readonly config: VoIPUserConfiguration, mediaRenderer?: IMediaStreamRenderer) {
		super();
		this.mediaStreamRendered = mediaRenderer;
		this.networkEmitter = new Emitter<SignalingSocketEvents>();
		this.connectionRetryCount = this.config.connectionRetryCount;
		this.stop = false;

		this.onlineNetworkHandler = this.onNetworkRestored.bind(this);
		this.offlineNetworkHandler = this.onNetworkLost.bind(this);
	}

	/**
	 * Configures and initializes sip.js UserAgent
	 * call gets established.
	 * @remarks
	 * This class configures transport properties such as websocket url, passed down in config,
	 * sets up ICE servers,
	 * SIP UserAgent options such as userName, Password, URI.
	 * Once initialized, it starts the userAgent.
	 */

	async init(): Promise<void> {
		const sipUri = `sip:${this.config.authUserName}@${this.config.sipRegistrarHostnameOrIP}`;
		const transportOptions = {
			server: this.config.webSocketURI,
			connectionTimeout: 100, // Replace this with config
			keepAliveInterval: 20,
			// traceSip: true,
		};
		const sdpFactoryOptions = {
			iceGatheringTimeout: 10,
			peerConnectionConfiguration: {
				iceServers: this.config.iceServers,
			},
		};
		this.userAgentOptions = {
			delegate: {
				onInvite: async (invitation: Invitation): Promise<void> => {
					await this.handleIncomingCall(invitation);
				},
			},
			authorizationPassword: this.config.authPassword,
			authorizationUsername: this.config.authUserName,
			uri: UserAgent.makeURI(sipUri),
			transportOptions,
			sessionDescriptionHandlerFactoryOptions: sdpFactoryOptions,
			logConfiguration: false,
			logLevel: 'error',
		};

		this.userAgent = new UserAgent(this.userAgentOptions);
		this.userAgent.transport.isConnected();
		this._opInProgress = Operation.OP_CONNECT;
		try {
			this.registerer = new Registerer(this.userAgent);

			this.userAgent.transport.onConnect = this.onConnected.bind(this);
			this.userAgent.transport.onDisconnect = this.onDisconnected.bind(this);
			window.addEventListener('online', this.onlineNetworkHandler);
			window.addEventListener('offline', this.offlineNetworkHandler);
			await this.userAgent.start();
			if (this.config.enableKeepAliveUsingOptionsForUnstableNetworks) {
				this.startOptionsPingForUnstableNetworks();
			}
		} catch (error) {
			this._connectionState = 'ERROR';
			throw error;
		}
	}

	async onConnected(): Promise<void> {
		this._connectionState = 'SERVER_CONNECTED';
		this.state.isReady = true;
		this.sendOptions();
		this.networkEmitter.emit('connected');
		/**
		 * Re-registration post network recovery should be attempted
		 * if it was previously registered or incall/onhold
		 */

		if (this.registerer && this.callState !== 'INITIAL') {
			this.attemptRegistration = true;
		}
	}

	onDisconnected(error: any): void {
		this._connectionState = 'SERVER_DISCONNECTED';
		this._opInProgress = Operation.OP_NONE;
		this.networkEmitter.emit('disconnected');
		if (error) {
			this.networkEmitter.emit('connectionerror', error);
			this.state.isReady = false;
			/**
			 * Signalling socket reconnection should be attempted assuming
			 * that the disconnect happened from the remote side or due to sleep
			 * In case of remote side disconnection, if config.connectionRetryCount is -1,
			 * attemptReconnection attempts continuously. Else stops after |config.connectionRetryCount|
			 *
			 */
			// this.attemptReconnection();
			this.attemptReconnection(0, false);
		}
	}

	onNetworkRestored(): void {
		this.networkEmitter.emit('localnetworkonline');
		if (this._connectionState === 'WAITING_FOR_NETWORK') {
			/**
			 * Signalling socket reconnection should be attempted when online event handler
			 * gets notified.
			 * Important thing to note is that the second parameter |checkRegistration| = true passed here
			 * because after the network recovery and after reconnecting to the server,
			 * the transport layer of SIPUA does not call onConnected. So by passing |checkRegistration = true |
			 * the code will check if the endpoint was previously registered before the disconnection.
			 * If such is the case, it will first unregister and then re-register.
			 * */
			this.attemptReconnection();
			if (this.registerer && this.callState !== 'INITIAL') {
				this.attemptRegistration = true;
			}
		}
	}

	onNetworkLost(): void {
		this.networkEmitter.emit('localnetworkoffline');
		this._connectionState = 'WAITING_FOR_NETWORK';
	}

	get userConfig(): VoIPUserConfiguration {
		return this.config;
	}

	get callState(): CallStates {
		return this._callState;
	}

	get connectionState(): ConnectionState {
		return this._connectionState;
	}

	get callerInfo(): VoIpCallerInfo {
		if (
			this.callState === 'IN_CALL' ||
			this.callState === 'OFFER_RECEIVED' ||
			this.callState === 'ON_HOLD' ||
			this.callState === 'OFFER_SENT'
		) {
			if (!this._callerInfo) {
				throw new Error('[VoIPUser callerInfo] invalid state');
			}
			return {
				state: this.callState,
				caller: this._callerInfo,
				userState: this._userState,
			};
		}
		return {
			state: this.callState,
			userState: this._userState,
		};
	}

	/* Media Stream functions begin */
	/** The local media stream. Undefined if call not answered. */
	get localMediaStream(): MediaStream | undefined {
		const sdh = this.session?.sessionDescriptionHandler;
		if (!sdh) {
			return undefined;
		}
		if (!(sdh instanceof SessionDescriptionHandler)) {
			throw new Error('Session description handler not instance of web SessionDescriptionHandler');
		}
		return sdh.localMediaStream;
	}

	/* Media Stream functions end */
	/* OutgoingRequestDelegate methods begin */
	onRegistrationRequestAccept(): void {
		if (this._opInProgress === Operation.OP_REGISTER) {
			this._callState = 'REGISTERED';
			this.emit('registered');
			this.emit('stateChanged');
		}
		if (this._opInProgress === Operation.OP_UNREGISTER) {
			this._callState = 'UNREGISTERED';
			this.emit('unregistered');
			this.emit('stateChanged');
		}
	}

	onRegistrationRequestReject(error: any): void {
		if (this._opInProgress === Operation.OP_REGISTER) {
			this.emit('registrationerror', error);
		}
		if (this._opInProgress === Operation.OP_UNREGISTER) {
			this.emit('unregistrationerror', error);
		}
	}
	/* OutgoingRequestDelegate methods end */

	private async handleIncomingCall(invitation: Invitation): Promise<void> {
		if (this.callState === 'REGISTERED') {
			this._opInProgress = Operation.OP_PROCESS_INVITE;
			this._callState = 'OFFER_RECEIVED';
			this._userState = UserState.UAS;
			this.session = invitation;
			this.setupSessionEventHandlers(invitation);
			const callerInfo: ICallerInfo = {
				callerId: invitation.remoteIdentity.uri.user ? invitation.remoteIdentity.uri.user : '',
				callerName: invitation.remoteIdentity.displayName,
				host: invitation.remoteIdentity.uri.host,
			};
			this._callerInfo = callerInfo;
			this.emit('incomingcall', callerInfo);
			this.emit('stateChanged');
			return;
		}

		await invitation.reject();
	}

	/**
	 * Sets up an listener handler for handling session's state change
	 * @remarks
	 * Called for setting up various state listeners. These listeners will
	 * decide the next action to be taken when the session state changes.
	 * e.g when session.state changes from |Establishing| to |Established|
	 * one must set up local and remote media rendering.
	 *
	 * This class handles such session state changes and takes necessary actions.
	 */

	protected setupSessionEventHandlers(session: Session): void {
		this.session?.stateChange.addListener((state: SessionState) => {
			if (this.session !== session) {
				return; // if our session has changed, just return
			}
			switch (state) {
				case SessionState.Initial:
					break;
				case SessionState.Establishing:
					this.emit('ringing', { userState: this._userState, callInfo: this._callerInfo });
					break;
				case SessionState.Established:
					if (this._userState === UserState.UAC) {
						/**
						 * We need to decide about user-state ANSWER-RECEIVED for outbound.
						 * This state is there for the symmetry of ANSWER-SENT.
						 * ANSWER-SENT occurs when there is incoming invite. So then the UA
						 * accepts a call, it sends the answer and state becomes ANSWER-SENT.
						 * The call gets established only when the remote party sends ACK.
						 *
						 * But in case of UAC where the invite is sent out, there is no intermediate
						 * state where the UA can be in ANSWER-RECEIVED. As soon this UA receives the answer,
						 * it sends ack and changes the SessionState to established.
						 *
						 * So we do not have an actual state transitions from ANSWER-RECEIVED to IN-CALL.
						 *
						 * Nevertheless, this state is just added to maintain the symmetry. This can be safely removed.
						 *
						 * */
						this._callState = 'ANSWER_RECEIVED';
					}
					this._opInProgress = Operation.OP_NONE;
					this.setupRemoteMedia();
					this._callState = 'IN_CALL';
					this.emit('callestablished', { userState: this._userState, callInfo: this._callerInfo });
					this.emit('stateChanged');
					break;
				case SessionState.Terminating:
				// fall through
				case SessionState.Terminated:
					this.session = undefined;
					this._callState = 'REGISTERED';
					this._opInProgress = Operation.OP_NONE;
					this._userState = UserState.IDLE;
					this.emit('callterminated');
					this.remoteStream?.clear();
					this.emit('stateChanged');
					break;
				default:
					throw new Error('Unknown session state.');
			}
		});
	}

	onTrackAdded(_event: any): void {
		console.log('onTrackAdded');
	}

	onTrackRemoved(_event: any): void {
		console.log('onTrackRemoved');
	}

	/**
	 * Carries out necessary steps for rendering remote media whe
	 * call gets established.
	 * @remarks
	 * Sets up Stream class and plays the stream on given Media element/
	 * Also sets up various event handlers.
	 */
	private setupRemoteMedia(): any {
		if (!this.session) {
			throw new Error('Session does not exist.');
		}
		const sdh = this.session?.sessionDescriptionHandler;
		if (!sdh) {
			return undefined;
		}
		if (!(sdh instanceof SessionDescriptionHandler)) {
			throw new Error('Session description handler not instance of web SessionDescriptionHandler');
		}

		const remoteStream = sdh.remoteMediaStream;
		if (!remoteStream) {
			throw new Error('Remote media stream is undefined.');
		}

		this.remoteStream = new RemoteStream(remoteStream);
		const mediaElement = this.mediaStreamRendered?.remoteMediaElement;
		if (mediaElement) {
			this.remoteStream.init(mediaElement);
			this.remoteStream.onTrackAdded(this.onTrackAdded.bind(this));
			this.remoteStream.onTrackRemoved(this.onTrackRemoved.bind(this));
			this.remoteStream.play();
		}
	}

	/**
	 * Handles call mute-unmute
	 */
	private async handleMuteUnmute(muteState: boolean): Promise<void> {
		const { session } = this;
		if (this._held === muteState) {
			return Promise.resolve();
		}
		if (!session) {
			throw new Error('Session not found');
		}

		const sessionDescriptionHandler = this.session?.sessionDescriptionHandler;
		if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
			throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
		}

		const options: SessionInviteOptions = {
			requestDelegate: {
				onAccept: (): void => {
					this._held = muteState;
					toggleMediaStreamTracks(!this._held, session, 'receiver');
					toggleMediaStreamTracks(!this._held, session, 'sender');
				},
				onReject: (): void => {
					this.emit('muteerror');
				},
			},
		};

		const { peerConnection } = sessionDescriptionHandler;
		if (!peerConnection) {
			throw new Error('Peer connection closed.');
		}
		return this.session
			?.invite(options)
			.then(() => {
				toggleMediaStreamTracks(!this._held, session, 'receiver');
				toggleMediaStreamTracks(!this._held, session, 'sender');
			})
			.catch((error: Error) => {
				if (error instanceof RequestPendingError) {
					console.error(`[${this.session?.id}] A mute request is already in progress.`);
				}
				this.emit('muteerror');
				throw error;
			});
	}

	/**
	 * Handles call hold-unhold
	 */
	private async handleHoldUnhold(holdState: boolean): Promise<void> {
		const { session } = this;
		if (this._held === holdState) {
			return Promise.resolve();
		}
		if (!session) {
			throw new Error('Session not found');
		}

		const sessionDescriptionHandler = this.session?.sessionDescriptionHandler;
		if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
			throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
		}
		const options: SessionInviteOptions = {
			requestDelegate: {
				onAccept: (): void => {
					this._held = holdState;
					this._callState = holdState ? 'ON_HOLD' : 'IN_CALL';
					toggleMediaStreamTracks(!this._held, session, 'receiver');
					toggleMediaStreamTracks(!this._held, session, 'sender');
					this._callState === 'ON_HOLD' ? this.emit('hold') : this.emit('unhold');
					this.emit('stateChanged');
				},
				onReject: (): void => {
					toggleMediaStreamTracks(!this._held, session, 'receiver');
					toggleMediaStreamTracks(!this._held, session, 'sender');
					this.emit('holderror');
				},
			},
		};

		// Session properties used to pass options to the SessionDescriptionHandler:
		//
		// 1) Session.sessionDescriptionHandlerOptions
		//    SDH options for the initial INVITE transaction.
		//    - Used in all cases when handling the initial INVITE transaction as either UAC or UAS.
		//    - May be set directly at anytime.
		//    - May optionally be set via constructor option.
		//    - May optionally be set via options passed to Inviter.invite() or Invitation.accept().
		//
		// 2) Session.sessionDescriptionHandlerOptionsReInvite
		//    SDH options for re-INVITE transactions.
		//    - Used in all cases when handling a re-INVITE transaction as either UAC or UAS.
		//    - May be set directly at anytime.
		//    - May optionally be set via constructor option.
		//    - May optionally be set via options passed to Session.invite().

		const sessionDescriptionHandlerOptions = session.sessionDescriptionHandlerOptionsReInvite as SessionDescriptionHandlerOptions;
		sessionDescriptionHandlerOptions.hold = holdState;
		session.sessionDescriptionHandlerOptionsReInvite = sessionDescriptionHandlerOptions;

		const { peerConnection } = sessionDescriptionHandler;
		if (!peerConnection) {
			throw new Error('Peer connection closed.');
		}
		return this.session
			?.invite(options)
			.then(() => {
				toggleMediaStreamTracks(!this._held, session, 'receiver');
				toggleMediaStreamTracks(!this._held, session, 'sender');
			})
			.catch((error: Error) => {
				if (error instanceof RequestPendingError) {
					console.error(`[${this.session?.id}] A hold request is already in progress.`);
				}
				this.emit('holderror');
				throw error;
			});
	}

	static async create(config: VoIPUserConfiguration, mediaRenderer?: IMediaStreamRenderer): Promise<VoIPUser> {
		const voip = new VoIPUser(config, mediaRenderer);
		await voip.init();
		return voip;
	}

	/**
	 * Sends SIP OPTIONS message to asterisk
	 *
	 * There is an interesting problem that happens with Asterisk.
	 * After websocket connection succeeds and if there is no SIP
	 * message goes in 30 seconds, asterisk disconnects the socket.
	 *
	 * If any SIP message goes before 30 seconds, asterisk holds the connection.
	 * This problem could be solved in multiple ways. One is that
	 * whenever disconnect happens make sure that the socket is connected back using
	 * this.userAgent.reconnect() method. But this is expensive as it does connect-disconnect
	 * every 30 seconds till we send register message.
	 *
	 * Another approach is to send SIP OPTIONS just to tell server that
	 * there is a UA using this socket. This is implemented below
	 */

	sendOptions(outgoingRequestDelegate?: OutgoingRequestDelegate): void {
		const uri = new URI('sip', this.config.authUserName, this.config.sipRegistrarHostnameOrIP);
		const outgoingMessage = this.userAgent?.userAgentCore.makeOutgoingRequestMessage('OPTIONS', uri, uri, uri, {});
		if (outgoingMessage) {
			this.userAgent?.userAgentCore.request(outgoingMessage, outgoingRequestDelegate);
		}
	}
	/**
	 * Public method called from outside to register the SIP UA with call server.
	 * @remarks
	 */

	register(): void {
		this._opInProgress = Operation.OP_REGISTER;
		this.registerer?.register({
			requestDelegate: {
				onAccept: this.onRegistrationRequestAccept.bind(this),
				onReject: this.onRegistrationRequestReject.bind(this),
			},
		});
	}

	/**
	 * Public method called from outside to unregister the SIP UA.
	 * @remarks
	 */

	unregister(): void {
		this._opInProgress = Operation.OP_UNREGISTER;
		this.registerer?.unregister({
			all: true,
			requestDelegate: {
				onAccept: this.onRegistrationRequestAccept.bind(this),
				onReject: this.onRegistrationRequestReject.bind(this),
			},
		});
	}
	/**
	 * Public method called from outside to accept incoming call.
	 * @remarks
	 */

	async acceptCall(mediaRenderer: IMediaStreamRenderer): Promise<void> {
		if (mediaRenderer) {
			this.mediaStreamRendered = mediaRenderer;
		}
		// Call state must be in offer_received.
		if (this._callState === 'OFFER_RECEIVED' && this._opInProgress === Operation.OP_PROCESS_INVITE) {
			this._callState = 'ANSWER_SENT';
			// Something is wrong, this session is not an instance of INVITE
			if (!(this.session instanceof Invitation)) {
				throw new Error('Session not instance of Invitation.');
			}
			/**
			 * It is important to decide when to add video option to the outgoing offer.
			 * This would matter when the reinvite goes out (In case of hold/unhold)
			 * This was added because there were failures in hold-unhold.
			 * The scenario was that if this client does hold-unhold first, and remote client does
			 * later, remote client goes in inconsistent state and hold-unhold does not work
			 * Where as if the remote client does hold-unhold first, this client can do it any number
			 * of times.
			 *
			 * Logic below works as follows
			 * Local video settings = true, incoming invite has video mline = false -> Any offer = audiovideo/ answer = audioonly
			 * Local video settings = true, incoming invite has video mline = true -> Any offer = audiovideo/ answer = audiovideo
			 * Local video settings = false, incoming invite has video mline = false -> Any offer = audioonly/ answer = audioonly
			 * Local video settings = false, incoming invite has video mline = true -> Any offer = audioonly/ answer = audioonly
			 *
			 */
			let videoInvite = !!this.config.enableVideo;

			const { body } = this.session;
			if (body && body.indexOf('m=video') === -1) {
				videoInvite = false;
			}

			const invitationAcceptOptions: InvitationAcceptOptions = {
				sessionDescriptionHandlerOptions: {
					constraints: {
						audio: true,
						video: !!this.config.enableVideo && videoInvite,
					},
				},
			};

			return this.session.accept(invitationAcceptOptions);
		}
		throw new Error('Something went wrong');
	}

	/* Helper routines for checking call actions BEGIN */

	private canRejectCall(): boolean {
		return ['OFFER_RECEIVED', 'OFFER_SENT'].includes(this._callState);
	}

	private canEndOrHoldCall(): boolean {
		return ['ANSWER_SENT', 'ANSWER_RECEIVED', 'IN_CALL', 'ON_HOLD', 'OFFER_SENT'].includes(this._callState);
	}

	/* Helper routines for checking call actions END */

	/**
	 * Public method called from outside to reject a call.
	 * @remarks
	 */
	rejectCall(): Promise<void> {
		if (!this.session) {
			throw new Error('Session does not exist.');
		}
		if (!this.canRejectCall()) {
			throw new Error(`Incorrect call State = ${this.callState}`);
		}
		if (!(this.session instanceof Invitation)) {
			throw new Error('Session not instance of Invitation.');
		}
		return this.session.reject();
	}

	/**
	 * Public method called from outside to end a call.
	 * @remarks
	 */
	async endCall(): Promise<OutgoingByeRequest | void> {
		if (!this.session) {
			throw new Error('Session does not exist.');
		}
		if (!this.canEndOrHoldCall()) {
			throw new Error(`Incorrect call State = ${this.callState}`);
		}

		// When call ends, force state to be revisited
		this.emit('stateChanged');
		switch (this.session.state) {
			case SessionState.Initial:
				if (this.session instanceof Invitation) {
					return this.session.reject();
				}
				throw new Error('Session not instance of Invitation.');
			case SessionState.Establishing:
				if (this.session instanceof Invitation) {
					return this.session.reject();
				}
				if (this.session instanceof Inviter) {
					return this.session.cancel();
				}
				throw new Error('Session not instance of Invitation.');
			case SessionState.Established:
				return this.session.bye();
			case SessionState.Terminating:
				break;
			case SessionState.Terminated:
				break;
			default:
				throw new Error('Unknown state');
		}
	}

	/**
	 * Public method called from outside to mute the call.
	 * @remarks
	 */
	async muteCall(muteState: boolean): Promise<void> {
		if (!this.session) {
			throw new Error('Session does not exist.');
		}
		if (this._callState !== 'IN_CALL') {
			throw new Error(`Incorrect call State = ${this.callState}`);
		}
		this.handleMuteUnmute(muteState);
	}

	/**
	 * Public method called from outside to hold the call.
	 * @remarks
	 */
	async holdCall(holdState: boolean): Promise<void> {
		if (!this.session) {
			throw new Error('Session does not exist.');
		}
		if (!this.canEndOrHoldCall()) {
			throw new Error(`Incorrect call State = ${this.callState}`);
		}
		this.handleHoldUnhold(holdState);
	}

	/* CallEventDelegate implementation end */
	isReady(): boolean {
		return this.state.isReady;
	}

	/**
	 * This function allows to change the media renderer media elements.
	 */
	switchMediaRenderer(mediaRenderer: IMediaStreamRenderer): void {
		if (this.remoteStream) {
			this.mediaStreamRendered = mediaRenderer;
			this.remoteStream.init(mediaRenderer.remoteMediaElement);
			this.remoteStream.onTrackAdded(this.onTrackAdded.bind(this));
			this.remoteStream.onTrackRemoved(this.onTrackRemoved.bind(this));
			this.remoteStream.play();
		}
	}

	setWorkflowMode(mode: WorkflowTypes): void {
		this.mode = mode;
		if (mode === WorkflowTypes.CONTACT_CENTER_USER) {
			this.queueInfo = new QueueAggregator();
		}
	}

	setMembershipSubscription(subscription: IQueueMembershipSubscription): void {
		if (this.mode !== WorkflowTypes.CONTACT_CENTER_USER) {
			return;
		}
		this.queueInfo?.setMembership(subscription);
	}

	getAggregator(): QueueAggregator {
		return this.queueInfo;
	}

	getRegistrarState(): string | undefined {
		return this.registerer?.state.toString().toLocaleLowerCase();
	}

	clear(): void {
		this._opInProgress = Operation.OP_CLEANUP;
		/** Socket reconnection is attempted when the socket is disconnected with some error.
		 * While disconnecting, if there is any socket error, there should be no reconnection attempt.
		 * So when userAgent.stop() is called which closes the sockets, it should be made sure that
		 * if the socket is disconnected with error, connection attempts are not started or
		 * if there are any previously ongoing attempts, they should be terminated.
		 * flag attemptReconnect is used for ensuring this.
		 */
		this.stop = true;
		this.userAgent?.stop();
		this.registerer?.dispose();
		this._connectionState = 'STOP';

		if (this.userAgent) {
			this.userAgent.transport.onConnect = undefined;
			this.userAgent.transport.onDisconnect = undefined;
			window.removeEventListener('online', this.onlineNetworkHandler);
			window.removeEventListener('offline', this.offlineNetworkHandler);
		}
	}

	onNetworkEvent(event: SocketEventKeys, handler: () => void): void {
		this.networkEmitter.on(event, handler);
	}

	offNetworkEvent(event: SocketEventKeys, handler: () => void): void {
		this.networkEmitter.off(event, handler);
	}

	/**
	 * Connection is lost in 3 ways
	 * 1. When local network is lost (Router is disconnected, switching networks, devtools->network->offline)
	 * In this case, the SIP.js's transport layer does not detect the disconnection. Hence, it does not
	 * call |onDisconnect|. To detect this kind of disconnection, window event listeners have been added.
	 * These event listeners would be get called when the browser detects that network is offline or online.
	 * When the network is restored, the code tries to reconnect. The useragent.transport "does not" generate the
	 * onconnected event in this case as well. so onlineNetworkHandler calls attemptReconnection.
	 * Which calls attemptRegistrationPostRecovery based on correct state. attemptRegistrationPostRecovery first tries to
	 * unregister and then re-register.
	 * Important note : We use the event listeners using bind function object offlineNetworkHandler and onlineNetworkHandler
	 * It is done so because the same event handlers need to be used for removeEventListener, which becomes impossible
	 * if done inline.
	 *
	 * 2. Computer goes to sleep. In this case onDisconnect is triggered. The code tries to reconnect but cant go ahead
	 * as it goes to sleep. On waking up, The attemptReconnection gets executed, connection is completed.
	 * In this case, it generates onConnected event. In this onConnected event it calls attemptRegistrationPostRecovery
	 *
	 * 3. When Asterisk disconnects all the endpoints either because it crashes or restarted,
	 * As soon as the agent successfully connects to asterisk, it should re-register
	 *
	 * Retry count :
	 * connectionRetryCount is the parameter called |Retry Count| in
	 * Administration -> Call Center -> Server configuration -> Retry count.
	 * The retry is implemented with backoff, maxbackoff = 8 seconds.
	 * For continuous retries (In case Asterisk restart happens) Set this parameter to -1.
	 *
	 * Important to note is how attemptRegistrationPostRecovery is called. In case of
	 * the router connection loss or while switching the networks,
	 * there is no disconnect and connect event from the transport layer of the userAgent.
	 * So in this case, when the connection is successful after reconnect, the code should try to re-register by calling
	 * attemptRegistrationPostRecovery.
	 * In case of computer waking from sleep or asterisk getting restored, connect and disconnect events are generated.
	 * In this case, re-registration should be triggered (by calling) only when onConnected gets called and not otherwise.
	 */

	async attemptReconnection(reconnectionAttempt = 0, checkRegistration = false): Promise<void> {
		const reconnectionAttempts = this.connectionRetryCount;
		this._connectionState = 'SERVER_RECONNECTING';
		if (!this.userAgent) {
			return;
		}
		if (this.stop) {
			return;
		}
		// reconnectionAttempts == -1 then keep continuously trying
		if (reconnectionAttempts !== -1 && reconnectionAttempt > reconnectionAttempts) {
			this._connectionState = 'ERROR';
			return;
		}

		const reconnectionDelay = Math.pow(2, reconnectionAttempt % 4);

		console.error(`Attempting to reconnect with backoff due to network loss. Backoff time [${reconnectionDelay}]`);
		setTimeout(() => {
			if (this.stop) {
				return;
			}
			if (this._connectionState === 'SERVER_CONNECTED') {
				return;
			}
			this.userAgent
				?.reconnect()
				.then(() => {
					this._connectionState = 'SERVER_CONNECTED';
				})
				.catch(() => {
					this.attemptReconnection(++reconnectionAttempt, checkRegistration);
				});
		}, reconnectionDelay * 1000);
	}

	async attemptPostRecoveryRoutine(): Promise<void> {
		/**
		 * It might happen that the whole network loss can happen
		 * while there is ongoing call. In that case, we want to maintain
		 * the call.
		 *
		 * So after re-registration, it should remain in the same state.
		 * */
		this.sendOptions({
			onAccept: (): void => {
				this.attemptPostRecoveryRegistrationRoutine();
			},
			onReject: (error: unknown): void => {
				console.error(`[${error}] Failed to do options in attemptPostRecoveryRoutine()`);
			},
		});
	}

	async sendKeepAliveAndWaitForResponse(withDebounce = false): Promise<boolean> {
		const promise = new Promise<boolean>((resolve, reject) => {
			let keepAliveAccepted = false;
			let responseWaitTime = this.optionsKeepaliveInterval / 2;
			if (withDebounce) {
				responseWaitTime += this.optionsKeepAliveDebounceTimeInSec;
			}

			this.sendOptions({
				onAccept: (): void => {
					keepAliveAccepted = true;
				},
				onReject: (_error: unknown): void => {
					console.error('Failed to do options.');
				},
			});
			setTimeout(async () => {
				if (!keepAliveAccepted) {
					reject(false);
				} else {
					if (this.attemptRegistration) {
						this.attemptPostRecoveryRoutine();
						this.attemptRegistration = false;
					}
					resolve(true);
				}
			}, responseWaitTime * 1000);
		});
		return promise;
	}

	async startOptionsPingForUnstableNetworks(): Promise<void> {
		setTimeout(async () => {
			if (!this.userAgent || this.stop) {
				return;
			}
			if (this._connectionState !== 'SERVER_RECONNECTING') {
				let isConnected = false;
				try {
					await this.sendKeepAliveAndWaitForResponse();
					isConnected = true;
				} catch (e) {
					console.error(`[${e}] Failed to do options ping.`);
				} finally {
					// Send event only if it's a "change" on the status (avoid unnecessary event flooding)
					!isConnected && this.networkEmitter.emit('disconnected');
					isConnected && this.networkEmitter.emit('connected');
				}
			}
			// Each seconds check if the network can reach asterisk. If not, try to reconnect
			this.startOptionsPingForUnstableNetworks();
		}, this.optionsKeepaliveInterval * 1000);
	}

	async attemptPostRecoveryRegistrationRoutine(): Promise<void> {
		/**
		 * It might happen that the whole network loss can happen
		 * while there is ongoing call. In that case, we want to maintain
		 * the call.
		 *
		 * So after re-registration, it should remain in the same state.
		 * */
		const promise = new Promise<void>((_resolve, _reject) => {
			this.registerer?.unregister({
				all: true,
				requestDelegate: {
					onAccept: (): void => {
						_resolve();
					},
					onReject: (error): void => {
						console.error(`[${error}] While unregistering after recovery`);
						this.emit('unregistrationerror', error);
						_reject('Error in Unregistering');
					},
				},
			});
		});
		try {
			await promise;
		} catch (error) {
			console.error(`[${error}] While waiting for unregister promise`);
		}
		this.registerer?.register({
			requestDelegate: {
				onReject: (error): void => {
					this._callState = 'UNREGISTERED';
					this.emit('registrationerror', error);
					this.emit('stateChanged');
				},
			},
		});
	}

	async changeAudioInputDevice(constraints: MediaStreamConstraints): Promise<boolean> {
		if (!this.session) {
			console.warn('changeAudioInputDevice() : No session. Returning');
			return false;
		}
		const newStream = await LocalStream.requestNewStream(constraints, this.session);
		if (!newStream) {
			console.warn('changeAudioInputDevice() : Unable to get local stream. Returning');
			return false;
		}
		const { peerConnection } = this.session?.sessionDescriptionHandler as SessionDescriptionHandler;
		if (!peerConnection) {
			console.warn('changeAudioInputDevice() : No peer connection. Returning');
			return false;
		}
		LocalStream.replaceTrack(peerConnection, newStream, 'audio');
		return true;
	}

	// Commenting this as Video Configuration is not part of the scope for now
	// async changeVideoInputDevice(selectedVideoDevices: IDevice): Promise<boolean> {
	// 	if (!this.session) {
	// 		console.warn('changeVideoInputDevice() : No session. Returning');
	// 		return false;
	// 	}
	// 	if (!this.config.enableVideo || this.deviceManager.hasVideoInputDevice()) {
	// 		console.warn('changeVideoInputDevice() : Unable change video device. Returning');
	// 		return false;
	// 	}
	// 	this.deviceManager.changeVideoInputDevice(selectedVideoDevices);
	// 	const newStream = await LocalStream.requestNewStream(this.deviceManager.getConstraints('video'), this.session);
	// 	if (!newStream) {
	// 		console.warn('changeVideoInputDevice() : Unable to get local stream. Returning');
	// 		return false;
	// 	}
	// 	const { peerConnection } = this.session?.sessionDescriptionHandler as SessionDescriptionHandler;
	// 	if (!peerConnection) {
	// 		console.warn('changeVideoInputDevice() : No peer connection. Returning');
	// 		return false;
	// 	}
	// 	LocalStream.replaceTrack(peerConnection, newStream, 'video');
	// 	return true;
	// }
	// eslint-disable-next-line @typescript-eslint/no-unused-vars

	async makeCallURI(_callee: string, _mediaRenderer?: IMediaStreamRenderer): Promise<void> {
		throw new Error('Not implemented');
	}

	async makeCall(_calleeNumber: string): Promise<void> {
		throw new Error('Not implemented');
	}
}
