import { Emitter } from '@rocket.chat/emitter';

import { ClientLogger } from '../../../lib/ClientLogger';
import { CallState } from './Callstate';
import { ICallerInfo, ICallEventDelegate } from './ICallEventDelegate';
import { IConnectionDelegate } from './IConnectionDelegate';
import { IRegisterHandlerDelegate } from './IRegisterHandlerDelegate';
import { VoIPUser } from './VoIPUser';
import { IMediaStreamRenderer, VoIPUserConfiguration } from './VoIPUserConfiguration';

interface IState {
	isReady: boolean;
	enableVideo: boolean;
}

export enum CallType {
	AUDIO,
	AUDIO_VIDEO,
}

export enum VoipEvents {
	'initialised',
	'connected',
	'connectionerror',
	'registered',
	'registrationerror',
	'unregistered',
	'unregistrationerror',
	'incomingcall',
	'callestablished',
	'callterminated',
	'negotiationfailed',
}
export class SimpleVoipUser
	implements IRegisterHandlerDelegate, IConnectionDelegate, ICallEventDelegate
{
	state: IState;

	userHandler: VoIPUser;

	userName: string;

	password: string;

	registrar: string;

	webSocketPath: string;

	callType: CallType | undefined;

	mediaStreamRendered?: IMediaStreamRenderer;

	iceServers: Array<object>;

	config: VoIPUserConfiguration = {};

	voipEventEmitter: Emitter;

	logger: ClientLogger;

	constructor(
		userName: string,
		password: string,
		registrar: string,
		webSocketPath: string,
		iceServers: Array<object>,
		callType?: CallType,
		mediaStreamRendered?: IMediaStreamRenderer,
	) {
		this.state = {
			isReady: false,
			enableVideo: true,
		};
		this.userName = userName;
		this.password = password;
		this.registrar = registrar;
		this.webSocketPath = webSocketPath;
		this.callType = callType;
		this.mediaStreamRendered = mediaStreamRendered;
		this.voipEventEmitter = new Emitter();
		this.iceServers = iceServers;
		this.logger = new ClientLogger('SimpleVoipUser');
	}

	/* RegisterHandlerDeligate implementation begin */
	onRegistered(): void {
		this.logger.info('onRegistered');
		if (this.voipEventEmitter.has(VoipEvents[VoipEvents.registered])) {
			this.voipEventEmitter.emit(VoipEvents[VoipEvents.registered]);
		}
	}

	onRegistrationError(reason: any): void {
		this.logger.error(`onRegistrationError${reason}`);
		if (this.voipEventEmitter.has(VoipEvents[VoipEvents.registrationerror])) {
			this.voipEventEmitter.emit(VoipEvents[VoipEvents.registrationerror], reason);
		}
	}

	onUnregistered(): void {
		this.logger.debug('onUnregistered');
		if (this.voipEventEmitter.has(VoipEvents[VoipEvents.unregistered])) {
			this.voipEventEmitter.emit(VoipEvents[VoipEvents.unregistered]);
		}
	}

	onUnregistrationError(error: any): void {
		this.logger.error('onUnregistrationError');
		if (this.voipEventEmitter.has(VoipEvents[VoipEvents.unregistrationerror])) {
			this.voipEventEmitter.emit(VoipEvents[VoipEvents.unregistrationerror], error);
		}
	}
	/* RegisterHandlerDeligate implementation end */

	/* ConnectionDelegate implementation begin */
	onConnected(): void {
		this.logger.debug('onConnected');
		if (this.voipEventEmitter.has(VoipEvents[VoipEvents.connected])) {
			this.voipEventEmitter.emit(VoipEvents[VoipEvents.connected]);
		}
		this.state.isReady = true;
	}

	onConnectionError(error: any): void {
		this.logger.error(`onConnectionError${error}`);
		if (this.voipEventEmitter.has(VoipEvents[VoipEvents.connectionerror])) {
			this.voipEventEmitter.emit(VoipEvents[VoipEvents.connectionerror], error);
		}
		this.state.isReady = false;
	}

	/* ConnectionDelegate implementation end */
	/* CallEventDelegate implementation begin */
	onIncomingCall(callerId: ICallerInfo): void {
		this.logger.debug('onIncomingCall');
		if (this.voipEventEmitter.has(VoipEvents[VoipEvents.incomingcall])) {
			this.voipEventEmitter.emit(VoipEvents[VoipEvents.incomingcall], callerId);
		}
	}

	onCallEstablished(): void {
		this.logger.debug('onCallEstablished');
		if (this.voipEventEmitter.has(VoipEvents[VoipEvents.callestablished])) {
			this.voipEventEmitter.emit(VoipEvents[VoipEvents.callestablished]);
		}
	}

	onCallTermination(): void {
		this.logger.debug('onCallTermination');
		if (this.voipEventEmitter.has(VoipEvents[VoipEvents.callterminated])) {
			this.voipEventEmitter.emit(VoipEvents[VoipEvents.callterminated]);
		}
	}

	/* CallEventDelegate implementation end */
	isReady(): boolean {
		return this.state.isReady;
	}

	async initUserAgent(): Promise<void> {
		this.config.authUserName = this.userName;
		this.config.authPassword = this.password;
		this.config.sipRegistrarHostnameOrIP = this.registrar;
		this.config.webSocketURI = this.webSocketPath;

		this.config.enableVideo = this.callType === CallType.AUDIO_VIDEO;
		this.config.connectionDelegate = this;
		this.config.iceServers = this.iceServers;
		this.userHandler = new VoIPUser(this.config, this, this, this, this.mediaStreamRendered);
		await this.userHandler.init();
	}

	async resetUserAgent(): Promise<void> {
		this.config = {};
		this.state.isReady = false;
	}

	async registerEndpoint(): Promise<void> {
		if (!this.userHandler) {
			try {
				await this.initUserAgent();
			} catch (error) {
				this.logger.error('registerEndpoint() Error in getting extension Info', error);
				throw error;
			}
		}
		// await this._apitest_debug();
		this.userHandler.register();
	}

	unregisterEndpoint(): void {
		this.userHandler.unregister();
	}

	async acceptCall(mediaRenderer?: IMediaStreamRenderer): Promise<any> {
		if (mediaRenderer) {
			this.mediaStreamRendered = mediaRenderer;
		}
		return this.userHandler.acceptCall(this.mediaStreamRendered);
	}

	async rejectCall(): Promise<any> {
		return this.userHandler.rejectCall();
	}

	async endCall(): Promise<any> {
		return this.userHandler.endCall();
	}

	setListener(event: VoipEvents, listener: (evData?: any) => void): void {
		this.voipEventEmitter.on(VoipEvents[event], listener);
	}

	removeListener(event: VoipEvents, listener: (evData?: any) => void): void {
		if (this.voipEventEmitter.has(VoipEvents[event])) {
			this.voipEventEmitter.off(VoipEvents[event], listener);
			return;
		}
		this.logger.error('removeListener() Event listener not found', VoipEvents[event]);
	}

	getState(): CallState | undefined {
		return this.userHandler.callState;
	}
}
