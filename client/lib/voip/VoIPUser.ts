/**
 * Class representing SIP UserAgent
 * @remarks
 * This class encapsulates all the details of sip.js and exposes
 * a very simple functions and callback handlers to the outside world.
 * This class thus abstracts user from Browser specific media details as well as
 * SIP specific protol details.
 */

import { Emitter } from '@rocket.chat/emitter';
import {
	UserAgent,
	UserAgentOptions,
	// UserAgentDelegate,
	Invitation,
	InvitationAcceptOptions,
	Session,
	SessionState,
	Registerer,
	SessionInviteOptions,
	RequestPendingError,
} from 'sip.js';
import { OutgoingByeRequest, OutgoingRequestDelegate, URI } from 'sip.js/lib/core';
import { SessionDescriptionHandler, SessionDescriptionHandlerOptions } from 'sip.js/lib/platform/web';

import { IQueueMembershipSubscription } from '../../../definition/IVoipExtension';
import { CallStates } from '../../../definition/voip/CallStates';
import { ICallerInfo } from '../../../definition/voip/ICallerInfo';
import { Operation } from '../../../definition/voip/Operations';
import { UserState } from '../../../definition/voip/UserState';
import { IMediaStreamRenderer, VoIPUserConfiguration } from '../../../definition/voip/VoIPUserConfiguration';
import { VoIpCallerInfo, IState } from '../../../definition/voip/VoIpCallerInfo';
import { VoipEvents } from '../../../definition/voip/VoipEvents';
import { WorkflowTypes } from '../../../definition/voip/WorkflowTypes';
import { toggleMediaStreamTracks } from './Helper';
import { QueueAggregator } from './QueueAggregator';
import Stream from './Stream';

export class VoIPUser extends Emitter<VoipEvents> implements OutgoingRequestDelegate {
	state: IState = {
		isReady: false,
		enableVideo: false,
	};

	private session: Session | undefined;

	private remoteStream: Stream | undefined;

	userAgentOptions: UserAgentOptions = {};

	userAgent: UserAgent | undefined;

	registerer: Registerer | undefined;

	mediaStreamRendered?: IMediaStreamRenderer;

	private _callState: CallStates = 'IDLE';

	private _callerInfo: ICallerInfo | undefined;

	private _userState: UserState = UserState.IDLE;

	private _held = false;

	private mode: WorkflowTypes;

	private queueInfo: QueueAggregator;

	get callState(): CallStates {
		return this._callState;
	}

	get callerInfo(): VoIpCallerInfo {
		if (this.callState === 'IN_CALL' || this.callState === 'OFFER_RECEIVED' || this.callState === 'ON_HOLD') {
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

	private _opInProgress: Operation = Operation.OP_NONE;

	get operationInProgress(): Operation {
		return this._opInProgress;
	}

	get userState(): UserState | undefined {
		return this._userState;
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
	constructor(private readonly config: VoIPUserConfiguration, mediaRenderer?: IMediaStreamRenderer) {
		super();
		this.mediaStreamRendered = mediaRenderer;
		this.on('connected', () => {
			this.state.isReady = true;
		});

		this.on('connectionerror', () => {
			this.state.isReady = false;
		});
	}

	/* UserAgentDelegate methods end */
	/* OutgoingRequestDelegate methods begin */
	onAccept(): void {
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

	onReject(error: any): void {
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

	private setupSessionEventHandlers(session: Session): void {
		this.session?.stateChange.addListener((state: SessionState) => {
			if (this.session !== session) {
				return; // if our session has changed, just return
			}
			switch (state) {
				case SessionState.Initial:
					break;
				case SessionState.Establishing:
					break;
				case SessionState.Established:
					this._opInProgress = Operation.OP_NONE;
					this._callState = 'IN_CALL';
					this.setupRemoteMedia();
					this.emit('callestablished');
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
			throw new Error('Remote media stream undefiend.');
		}

		this.remoteStream = new Stream(remoteStream);
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
			// traceSip: true
		};
		const sdpFactoryOptions = {
			iceGatheringTimeout: 10,
			peerConnectionConfiguration: {
				iceServers: this.config.iceServers,
			},
		};
		this.userAgentOptions = {
			delegate: {
				/* UserAgentDelegate methods begin */
				onConnect: (): void => {
					this._callState = 'SERVER_CONNECTED';

					this.emit('connected');
					/**
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
					 **/

					const uri = new URI('sip', this.config.authUserName, this.config.sipRegistrarHostnameOrIP);
					const outgoingMessage = this.userAgent?.userAgentCore.makeOutgoingRequestMessage('OPTIONS', uri, uri, uri, {});
					if (outgoingMessage) {
						this.userAgent?.userAgentCore.request(outgoingMessage);
					}
					if (this.userAgent) {
						this.registerer = new Registerer(this.userAgent);
					}
				},
				onDisconnect: (error: any): void => {
					if (error) {
						this.emit('connectionerror', error);
					}
				},
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
		this._opInProgress = Operation.OP_CONNECT;
		await this.userAgent.start();
	}

	static async create(config: VoIPUserConfiguration, mediaRenderer?: IMediaStreamRenderer): Promise<VoIPUser> {
		const voip = new VoIPUser(config, mediaRenderer);
		await voip.init();
		return voip;
	}

	/**
	 * Public method called from outside to register the SIP UA with call server.
	 * @remarks
	 */

	register(): void {
		this._opInProgress = Operation.OP_REGISTER;
		this.registerer?.register({
			requestDelegate: this,
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
			requestDelegate: this,
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
			// Somethingis wrong, this session is not an instance of INVITE
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
		throw new Error('Something went wront');
	}

	/**
	 * Public method called from outside to reject a call.
	 * @remarks
	 */
	rejectCall(): Promise<void> {
		if (!this.session) {
			throw new Error('Session does not exist.');
		}
		if (this._callState !== 'OFFER_RECEIVED') {
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
		if (this._callState !== 'ANSWER_SENT' && this._callState !== 'IN_CALL' && this._callState !== 'ON_HOLD') {
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
		if (this._callState !== 'ANSWER_SENT' && this._callState !== 'IN_CALL' && this._callState !== 'ON_HOLD') {
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
		this.userAgent?.stop();
	}
}
