/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import {
	UserAgent,
	UserAgentOptions,
	UserAgentDelegate,
	Invitation,
	InvitationAcceptOptions,
	Session,
	SessionState,
	Registerer,
} from 'sip.js';
import { OutgoingRequestDelegate } from 'sip.js/lib/core';
import { SessionDescriptionHandler } from 'sip.js/lib/platform/web';

import { ICallEventDelegate } from './CallEventDelegate';
import { CallState } from './Callstate';
import { IConnectionDelegate } from './ConnectionDelegate';
import { Operation } from './Operations';
import { IRegisterHandlerDeligate } from './RegisterHandlerDelegate';
import Stream from './media/Stream';

// User state is based on whether the User has sent an invite(UAC) or it
// has received an invite (UAS)
enum UserState {
	IDLE,
	UAC,
	UAS,
}
export class User implements UserAgentDelegate, OutgoingRequestDelegate {
	private connectionDelegate: IConnectionDelegate;

	private registrationDelegate: IRegisterHandlerDeligate;

	private callEventDelegate: ICallEventDelegate;

	private session: Session | undefined;

	private remoteStream: Stream | undefined;

	private config: any = {};

	userAgentOptions: UserAgentOptions = {};

	userAgent: UserAgent | undefined;

	registerer: Registerer | undefined;

	private _callState: CallState = CallState.IDLE;

	get callState(): CallState {
		return this._callState;
	}

	private _opInProgress: Operation = Operation.OP_NONE;

	get operationInProgress(): Operation {
		return this._opInProgress;
	}

	private _userState: UserState | undefined;

	get userState(): any {
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
	constructor(
		config: any,
		cDelegate: IConnectionDelegate,
		rDelegate: IRegisterHandlerDeligate,
		cEventDelegate: ICallEventDelegate,
	) {
		this.config = config;
		this.connectionDelegate = cDelegate;
		this.registrationDelegate = rDelegate;
		this.callEventDelegate = cEventDelegate;
		this._userState = UserState.IDLE;
	}

	/* UserAgentDelegate methods begin */
	onConnect(): void {
		this._callState = CallState.SERVER_CONNECTED;
		console.log('Connected');
		this.connectionDelegate.onConnected?.();
		if (this.userAgent) {
			this.registerer = new Registerer(this.userAgent);
		}
	}

	onDisconnect(error: any): void {
		if (error) {
			this.connectionDelegate.onConnectionError?.(`Connection Error ${error}`);
		}
		console.log('Disconnected');
	}

	async onInvite(invitation: Invitation): Promise<void> {
		await this.handleIncomingCall(invitation);
	}

	/* UserAgentDelegate methods end */
	/* OutgoingRequestDelegate methods begin */
	onAccept(): void {
		if (this._opInProgress === Operation.OP_REGISTER) {
			this.registrationDelegate.onRegistered?.();
			this._callState = CallState.REGISTERED;
		} else if (this._opInProgress === Operation.OP_UNREGISTER) {
			this.registrationDelegate.onUnregistered?.();
			this._callState = CallState.UNREGISTERED;
		}
	}

	onReject(error: any): void {
		if (this._opInProgress === Operation.OP_REGISTER) {
			this.registrationDelegate.onRegistrationError?.(error);
		} else if (this._opInProgress === Operation.OP_UNREGISTER) {
			this.registrationDelegate.onUnregistrationError?.(error);
		}
	}
	/* OutgoingRequestDelegate methods end */

	private async handleIncomingCall(invitation: Invitation): Promise<void> {
		if (this.callState === CallState.REGISTERED) {
			this._opInProgress = Operation.OP_PROCESS_INVITE;
			this._callState = CallState.OFFER_RECEIVED;
			this._userState = UserState.UAS;
			this.session = invitation;
			this.setupSessionEventHandlers(invitation);
			this.callEventDelegate.onIncomingCall?.(invitation.id);
		} else {
			await invitation.reject();
			console.log('Rejected Invite');
		}
	}

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
					this._callState = CallState.IN_CALL;
					this.setupRemoteMedia();
					this.callEventDelegate?.onCallEstablished?.();
					break;
				case SessionState.Terminating:
				// fall through
				case SessionState.Terminated:
					this.session = undefined;
					this.callEventDelegate?.onCallTermination?.();
					this.remoteStream?.clear();
					this._callState = CallState.REGISTERED;
					this._opInProgress = Operation.OP_NONE;
					this._userState = UserState.IDLE;
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
		const mediaElement = this.config.media?.remote_video_element;

		if (mediaElement) {
			this.remoteStream.init(mediaElement);
			this.remoteStream.onTrackAdded(this.onTrackAdded.bind(this));
			this.remoteStream.onTrackRemoved(this.onTrackRemoved.bind(this));
			this.remoteStream.play();
		}
	}

	async init(): Promise<any> {
		const sipUri = `sip:${this.config.auth_user_name}@${this.config.sip_registrar_hostname_ip}`;
		const transportOptions = {
			server: this.config.websocket_uri,
			connectionTimeout: 10, // Replace this with config
			keepAliveInterval: 20,
			// traceSip: true
		};
		const sdpFactoryOptions = {
			iceGatheringTimeout: 10,
			peerConnectionConfiguration: {
				iceServers: this.config.ice_servers,
			},
		};
		this.userAgentOptions = {
			delegate: this,
			authorizationPassword: this.config.password,
			authorizationUsername: this.config.auth_user_name,
			uri: UserAgent.makeURI(sipUri),
			transportOptions,
			sessionDescriptionHandlerFactoryOptions: sdpFactoryOptions,
			displayName: this.config.display_name,
			logConfiguration: false,
		};

		this.userAgent = new UserAgent(this.userAgentOptions);
		this._opInProgress = Operation.OP_CONNECT;
		await this.userAgent.start();
	}

	register(): void {
		this._opInProgress = Operation.OP_REGISTER;
		this.registerer?.register({
			requestDelegate: this,
		});
	}

	unregister(): void {
		this._opInProgress = Operation.OP_UNREGISTER;
		this.registerer?.unregister({
			all: true,
			requestDelegate: this,
		});
	}

	async acceptCall(): Promise<void> {
		if (
			this._callState === CallState.OFFER_RECEIVED &&
			this._opInProgress === Operation.OP_PROCESS_INVITE
		) {
			this._callState = CallState.ANSWER_SENT;
			const invitationAcceptOptions: InvitationAcceptOptions = {
				sessionDescriptionHandlerOptions: {
					constraints: {
						audio: true,
						video: !!this.config.enable_video,
					},
				},
			};
			if (!(this.session instanceof Invitation)) {
				throw new Error('Session not instance of Invitation.');
			}
			return this.session.accept(invitationAcceptOptions);
		}
		alert('Something wrong again');
		throw new Error('Something went wront');
	}

	// Handling only for incoming call.
	rejectCall(): any {
		if (!this.session) {
			throw new Error('Session does not exist.');
		}
		if (this._callState !== CallState.OFFER_RECEIVED) {
			throw new Error(`Incorrect call State = ${this.callState}`);
		}
		if (!(this.session instanceof Invitation)) {
			throw new Error('Session not instance of Invitation.');
		}
		return this.session.reject();
	}

	async endCall(): Promise<any> {
		if (!this.session) {
			throw new Error('Session does not exist.');
		}
		if (this._callState !== CallState.ANSWER_SENT && this._callState !== CallState.IN_CALL) {
			throw new Error(`Incorrect call State = ${this.callState}`);
		}
		switch (this.session.state) {
			case SessionState.Initial:
				if (this.session instanceof Invitation) {
					return this.session.reject();
				}
				throw new Error('Unknown session type.');

			case SessionState.Establishing:
				if (this.session instanceof Invitation) {
					return this.session.reject();
				}
				throw new Error('Unknown session type.');

			case SessionState.Established:
				return this.session.bye();
			case SessionState.Terminating:
				break;
			case SessionState.Terminated:
				break;
			default:
				throw new Error('Unknown state');
		}
		console.log('Ended');
	}
}
