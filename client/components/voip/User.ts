/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import {
  UserAgent, UserAgentOptions, UserAgentDelegate, Invitation, InvitationAcceptOptions,
  Session,
  SessionState
} from "sip.js";
import { ConnectionDelegate } from "./ConnectionDelegate";
import { Registerer } from "sip.js";
import { OutgoingRequestDelegate } from "sip.js/lib/core";
import { CallState } from "./Callstate";
import { Operation } from "./Operations";
import { RegisterHandlerDeligate } from "./RegisterHandlerDelegate";
import { CallEventDelegate } from "./CallEventDelegate";
import { Stream } from "./media/Stream";
import { SessionDescriptionHandler } from "sip.js/lib/platform/web";

// User state is based on whether the User has sent an invite(UAC) or it 
// has received an invite (UAS)
enum UserState {
  IDLE,
  UAC,
  UAS
}
export class User implements UserAgentDelegate, OutgoingRequestDelegate {
  private connectionDelegate: ConnectionDelegate;
  private registrationDelegate: RegisterHandlerDeligate;
  private callEventDelegate: CallEventDelegate;
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
  get userState() {
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
      throw new Error("Session description handler not instance of web SessionDescriptionHandler");
    }
    return sdh.localMediaStream;
  }
  /* Media Stream functions end */
  constructor(config: any,
    cDelegate: ConnectionDelegate,
    rDelegate: RegisterHandlerDeligate,
    cEventDelegate: CallEventDelegate) {
    this.config = config;
    this.connectionDelegate = cDelegate;
    this.registrationDelegate = rDelegate;
    this.callEventDelegate = cEventDelegate;
    this._userState = UserState.IDLE;
  }
  /* UserAgentDelegate methods begin */
  onConnect() {
    this._callState = CallState.SERVER_CONNECTED;
    console.log("Connected");
    this.connectionDelegate.onConnected?.();
    if (this.userAgent)
      this.registerer = new Registerer(this.userAgent)
  }
  onDisconnect(error: any) {
    if (error) {
      //this._callState = CallState.ERROR;
      this.connectionDelegate.onConnectionError?.("Connection Error " + error);
    }
    console.log("Disconnected");
  }
  async onInvite(invitation: Invitation) {
    await this.handleIncomingCall(invitation);
  }
  /* UserAgentDelegate methods end */
  /* OutgoingRequestDelegate methods begin */
  onAccept() {
    if (this._opInProgress === Operation.OP_REGISTER) {
      this.registrationDelegate.onRegistered?.();
      this._callState = CallState.REGISTERED
    } else if (this._opInProgress === Operation.OP_UNREGISTER) {
      this.registrationDelegate.onUnregistered?.();
      this._callState = CallState.UNREGISTERED
    }
  }
  onReject(error: any) {
    if (this._opInProgress === Operation.OP_REGISTER) {
      this.registrationDelegate.onRegistrationError?.(error);
    } else if (this._opInProgress === Operation.OP_UNREGISTER) {
      this.registrationDelegate.onUnregistrationError?.(error);
    }
  }
  /* OutgoingRequestDelegate methods end */


  private async handleIncomingCall(invitation: Invitation) {
    if (this.callState == CallState.REGISTERED) {
      this._opInProgress = Operation.OP_PROCESS_INVITE;
      this._callState = CallState.OFFER_RECEIVED;
      this._userState = UserState.UAS;
      this.session = invitation;
      this.setupSessionEventHandlers(invitation);
      this.callEventDelegate.onIncomingCall?.(invitation.id);
    } else {
      await invitation.reject()
      console.log("Rejected Invite");
    }

  }
  private setupSessionEventHandlers(session: Session) {
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
          throw new Error("Unknown session state.");
      }
    });
  }
  onTrackAdded(event: any) {
    console.log("onTrackAdded")
  }

  onTrackRemoved(event: any) {
    console.log("onTrackRemoved")

  }
  private setupRemoteMedia() {
    if (!this.session) {
      throw new Error("Session does not exist.");
    }
    const sdh = this.session?.sessionDescriptionHandler;
    if (!sdh) {
      return undefined;
    }
    if (!(sdh instanceof SessionDescriptionHandler)) {
      throw new Error("Session description handler not instance of web SessionDescriptionHandler");
    }


    const remoteStream = sdh.remoteMediaStream;
    if (!remoteStream) {
      throw new Error("Remote media stream undefiend.");
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

  async init() {
    let sipUri = "sip:" + this.config.auth_user_name + "@" + this.config.sip_registrar_hostname_ip;
    let transportOptions = {
      server: this.config.websocket_uri,
      connectionTimeout: 10, // Replace this with config
      keepAliveInterval: 20
      //traceSip: true
    }
    let sdpFactoryOptions = {
      iceGatheringTimeout: 10,
      peerConnectionConfiguration: {
        iceServers: this.config.ice_servers
      }
    }
    this.userAgentOptions = {
      delegate: this,
      authorizationPassword: this.config.password,
      authorizationUsername: this.config.auth_user_name,
      uri: UserAgent.makeURI(sipUri),
      transportOptions: transportOptions,
      sessionDescriptionHandlerFactoryOptions: sdpFactoryOptions,
      displayName: this.config.display_name,
      logConfiguration: false
    };

    this.userAgent = new UserAgent(this.userAgentOptions);
    this._opInProgress = Operation.OP_CONNECT;
    await this.userAgent.start();
  }
  register() {
    this._opInProgress = Operation.OP_REGISTER;
    this.registerer?.register({
      requestDelegate: this
    });
  }
  unregister() {
    this._opInProgress = Operation.OP_UNREGISTER;
    this.registerer?.unregister({
      all: true,
      requestDelegate: this
    });
  }
  async acceptCall() {
    if (this._callState == CallState.OFFER_RECEIVED &&
      this._opInProgress == Operation.OP_PROCESS_INVITE) {
      this._callState = CallState.ANSWER_SENT;
      const invitationAcceptOptions: InvitationAcceptOptions = {
        sessionDescriptionHandlerOptions: {
          constraints:
          {
            audio: true,
            video: this.config.enable_video ? true : false
          }
        }
      };
      if (!(this.session instanceof Invitation)) {
        throw new Error("Session not instance of Invitation.")
      }
      return await this.session.accept(invitationAcceptOptions);
    } else {
      alert("Something wrong again");
    }
  }

  // Handling only for incoming call.
  rejectCall() {
    if (!this.session) {
      throw new Error("Session does not exist.");
    }
    if (this._callState !== CallState.OFFER_RECEIVED) {
      throw new Error("Incorrect call State = " + this.callState);
    }
    if (!(this.session instanceof Invitation)) {
      throw new Error("Session not instance of Invitation.");
    }
    return this.session.reject();
  }

  async endCall() {
    if (!this.session) {
      throw new Error("Session does not exist.");
    }
    if (this._callState !== CallState.ANSWER_SENT && this._callState !== CallState.IN_CALL) {
      throw new Error("Incorrect call State = " + this.callState);
    }

    switch (this.session.state) {
      case SessionState.Initial:
        if (this.session instanceof Invitation) {
          return await this.session.reject()
        } else {
          throw new Error("Unknown session type.");
        }
      case SessionState.Establishing:
        if (this.session instanceof Invitation) {
          return await this.session.reject()
        } else {
          throw new Error("Unknown session type.");
        }
      case SessionState.Established:
        return await this.session.bye()
      case SessionState.Terminating:
        break;
      case SessionState.Terminated:
        break;
      default:
        throw new Error("Unknown state");
    }
    console.log("Ended");
  }
}
