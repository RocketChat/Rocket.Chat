import React from 'react';

import { APIClient } from '../../../app/utils/client/lib/RestApiClient';
import { ClientLogger } from '../../../lib/ClientLogger';
import { ICallEventDelegate } from '../../components/voip/ICallEventDelegate';
import { IConnectionDelegate } from '../../components/voip/IConnectionDelegate';
import { IRegisterHandlerDelegate } from '../../components/voip/IRegisterHandlerDelegate';
import { VoIPUser } from '../../components/voip/VoIPUser';
import { VoIPUserConfiguration } from '../../components/voip/VoIPUserConfiguration';

interface IState {
	isReady?: boolean;
	enableVideo?: boolean;
}

class VoIPLayout
	extends React.Component<{}, IState>
	implements IRegisterHandlerDelegate, IConnectionDelegate, ICallEventDelegate
{
	VoipUserIdentity: any;

	userHandler: VoIPUser | undefined;

	userName: React.RefObject<HTMLInputElement>;

	password: React.RefObject<HTMLInputElement>;

	registrar: React.RefObject<HTMLInputElement>;

	webSocketPath: React.RefObject<HTMLInputElement>;

	callTypeSelection: React.RefObject<HTMLInputElement>;

	config: VoIPUserConfiguration = {};

	logger: ClientLogger;

	constructor() {
		super({});
		this.state = {
			isReady: false,
			enableVideo: true,
		};
		this.userName = React.createRef();
		this.password = React.createRef();
		this.registrar = React.createRef();
		this.webSocketPath = React.createRef();
		this.callTypeSelection = React.createRef();
		this.logger = new ClientLogger('VoIPLayout');
		this.VoipUserIdentity = null;
	}

	/**
	 * This function is just to verify all the REST APIs for the development phase.
	 * Once we have final UI, this file will be deleted.
	 */
	private async apiVerificationRoutine(): Promise<void> {
		/*
		try {
			this.logger.info('Executing voipServerConfig.callServer');
			const output = await APIClient.v1.post(
				'voipServerConfig.callServer',
				{},
				{
					host: 'omni-asterisk.dev.rocket.chat',
					websocketPort: 443,
					serverName: 'OmniAsterisk',
					websocketPath: 'wss://omni-asterisk.dev.rocket.chat/ws',
				},
			);
			this.logger.info('voipServerConfig.callServer output = ', JSON.stringify(output));
		} catch (error) {
			this.logger.error(`error ${error} in API voipServerConfig.callServer`);
		}
		try {
			this.logger.info('Executing voipServerConfig.management');
			const output = await APIClient.v1.post(
				'voipServerConfig.management',
				{},
				{
					host: 'omni-asterisk.dev.rocket.chat',
					port: 5038,
					serverName: 'OmniAsterisk',
					username: 'amol',
					password: '1234',
				},
			);
			this.logger.info('voipServerConfig.management output = ', JSON.stringify(output));
		} catch (error) {
			this.logger.error(`error ${error} in API voipServerConfig.management`);
		}
		*/
		try {
			this.logger.info('Executing connector.getVersion');
			const list = await APIClient.v1.get('connector.getVersion');
			this.logger.info('connector.getVersion output = ', JSON.stringify(list));
		} catch (error) {
			this.logger.error(`error ${error} in API connector.getVersion`);
		}
		try {
			this.logger.info('Executing voipServerConfig.management');
			const output = await APIClient.v1.get('voipServerConfig.management');
			this.logger.info('voipServerConfig.management output = ', JSON.stringify(output));
		} catch (error) {
			this.logger.error(`error ${error} in API voipServerConfig.management`);
		}
		try {
			this.logger.info('Executing voipServerConfig.callServer');
			const output = await APIClient.v1.get('voipServerConfig.callServer');
			this.logger.info('voipServerConfig.callServer output = ', JSON.stringify(output));
		} catch (error) {
			this.logger.error(`error ${error} in API voipServerConfig.callServer`);
		}

		try {
			this.logger.info('Executing queues.getSummary');
			const list = await APIClient.v1.get('voip/queues.getSummary');
			this.logger.info('queues.getSummary output = ', JSON.stringify(list));
		} catch (error) {
			this.logger.error(`error ${error} in API queues.getSummary`);
		}

		try {
			this.logger.info('Executing queues.getQueuedCallsForThisExtension');
			const list = await APIClient.v1.get('voip/queues.getQueuedCallsForThisExtension', {
				extension: '80000',
			});
			this.logger.info('queues.getQueuedCallsForThisExtension output = ', JSON.stringify(list));
		} catch (error) {
			this.logger.error(`error ${error} in API queues.getQueuedCallsForThisExtension`);
		}

		try {
			this.logger.info('Executing connector.extension.list');
			const list = await APIClient.v1.get('connector.extension.list');
			this.logger.info('connector.extension.list output = ', JSON.stringify(list));
		} catch (error) {
			this.logger.error(`error ${error} in API onnector.extension.list`);
		}

		try {
			this.logger.info('Executing connector.extension.getDetails');
			const list = await APIClient.v1.get('connector.extension.getDetails', {
				extension: '80000',
			});
			this.logger.info('connector.extension.getDetails output = ', JSON.stringify(list));
		} catch (error) {
			this.logger.error(`error ${error} in API connector.extension.getDetails`);
		}

		try {
			const userIdentity = await APIClient.v1.get('connector.extension.getRegistrationInfo', {
				extension: '80000',
			});
			this.logger.info('list = ', JSON.stringify(userIdentity));
		} catch (error) {
			this.logger.error(`error ${error} in API connector.extension.getRegistrationInfo`);
		}
	}

	private async initUserAgent(): Promise<void> {
		let extension = '80000';
		if (this.userName.current && this.userName.current.value) {
			extension = this.userName.current.value;
		}
		try {
			this.VoipUserIdentity = await APIClient.v1.get('connector.extension.getRegistrationInfo', {
				extension,
			});
			this.logger.info('list = ', JSON.stringify(this.VoipUserIdentity));
		} catch (error) {
			this.logger.error('error in API');
			throw error;
		}

		if (this.VoipUserIdentity.extensionDetails.extension && this.userName.current) {
			this.userName.current.textContent = this.VoipUserIdentity.extensionDetails.extension;
			this.userName.current.disabled = true;
			this.config.authUserName = this.VoipUserIdentity.extensionDetails.extension;
		}
		if (this.VoipUserIdentity.extensionDetails.password && this.password.current) {
			this.password.current.value = this.VoipUserIdentity.extensionDetails.password;
			this.password.current.disabled = true;
			this.config.authPassword = this.VoipUserIdentity.extensionDetails.password;
		}
		if (this.VoipUserIdentity.host && this.registrar.current) {
			this.registrar.current.value = this.VoipUserIdentity.host;
			this.registrar.current.disabled = true;
			this.config.sipRegistrarHostnameOrIP = this.VoipUserIdentity.host;
		}
		if (this.VoipUserIdentity.callServerConfig.websocketPath && this.webSocketPath.current) {
			this.webSocketPath.current.value = this.VoipUserIdentity.callServerConfig.websocketPath;
			this.webSocketPath.current.disabled = true;
			this.config.webSocketURI = this.VoipUserIdentity.callServerConfig.websocketPath;
		}

		this.config.enableVideo = this.state.enableVideo;
		this.config.connectionDelegate = this;
		/**
		 * Note : Following hardcoding needs to be removed. Where to get this data from, needs to
		 * be decided. Administration -> RateLimiter -> WebRTC has a setting for stun/turn servers.
		 * Nevertheless, whether it is configurebla by agent or not is to be found out.
		 * Agent will control these settings.
		 */
		this.config.iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
		const videoElement = document.getElementById('remote_video') as HTMLMediaElement;
		if (videoElement) {
			this.config.mediaElements = {
				remoteStreamMediaElement: videoElement,
			};
		}
		this.userHandler = new VoIPUser(this.config, this, this, this);
		await this.userHandler?.init();
	}

	private async resetUserAgent(): Promise<void> {
		this.VoipUserIdentity = null;
		if (this.userName.current) {
			this.userName.current.textContent = '';
			this.userName.current.disabled = false;
		}
		if (this.password.current) {
			this.password.current.textContent = '';
			// this.password.current.disabled = false;
		}
		if (this.registrar.current) {
			this.registrar.current.textContent = '';
			// this.registrar.current.disabled = false;
		}
		if (this.webSocketPath.current) {
			this.webSocketPath.current.textContent = '';
			// this.webSocketPath.current.disabled = false;
		}
		this.config = {};
		this.userHandler = undefined;
	}

	/* RegisterHandlerDeligate implementation begin */
	onRegistered(): void {
		this.logger.info('onRegistered');
		let element = document.getElementById('register');
		if (element) {
			// (element as HTMLInputElement).disabled = true;
			element.style.display = 'none';
		}
		element = document.getElementById('unregister');
		if (element) {
			element.style.display = 'block';
		}
	}

	onRegistrationError(reason: any): void {
		this.logger.error(`onRegistrationError${reason}`);
	}

	onUnregistered(): void {
		this.logger.debug('onUnregistered');
		let element = document.getElementById('register');
		if (element) {
			// (element as HTMLInputElement).disabled = true;
			element.style.display = 'block';
		}
		element = document.getElementById('unregister');
		if (element) {
			element.style.display = 'none';
		}
	}

	onUnregistrationError(): void {
		this.logger.error('onUnregistrationError');
	}
	/* RegisterHandlerDeligate implementation end */

	/* ConnectionDelegate implementation begin */
	onConnected(): void {
		this.logger.debug('onConnected');
		let element = document.getElementById('register');
		if (element) {
			element.style.display = 'block';
		}
		element = document.getElementById('unregister');
		if (element) {
			element.style.display = 'none';
		}
	}

	onConnectionError(error: any): void {
		this.logger.error(`onConnectionError${error}`);
	}

	/* ConnectionDelegate implementation end */
	/* CallEventDelegate implementation begin */
	onIncomingCall(_callingPartyName: string): void {
		let element = document.getElementById('accept_call');
		if (element) {
			element.style.display = 'block';
		}
		element = document.getElementById('reject_call');
		if (element) {
			element.style.display = 'block';
		}
	}

	onCallEstablished(): void {
		let element = document.getElementById('accept_call');
		if (element) {
			element.style.display = 'none';
		}
		element = document.getElementById('reject_call');
		if (element) {
			element.style.display = 'none';
		}
		element = document.getElementById('end_call');
		if (element) {
			element.style.display = 'block';
		}
	}

	onCallTermination(): void {
		let element = document.getElementById('accept_call');
		if (element) {
			element.style.display = 'none';
		}
		element = document.getElementById('reject_call');
		if (element) {
			element.style.display = 'none';
		}
		element = document.getElementById('end_call');
		if (element) {
			element.style.display = 'none';
		}
	}
	/* CallEventDelegate implementation end */

	async componentDidMount(): Promise<void> {
		this.apiVerificationRoutine();
		let element = document.getElementById('register');
		if (element) {
			element.style.display = 'none';
		}
		element = document.getElementById('unregister');
		if (element) {
			element.style.display = 'none';
		}
		element = document.getElementById('accept_call');
		if (element) {
			element.style.display = 'none';
		}
		element = document.getElementById('reject_call');
		if (element) {
			element.style.display = 'none';
		}
		element = document.getElementById('end_call');
		if (element) {
			element.style.display = 'none';
		}
		if (!this.userHandler) {
			try {
				await this.initUserAgent();
				this.setState({ isReady: true });
			} catch (error) {
				this.logger.error('componentDidMount() Error in getting extension Info', error);
				throw error;
			}
		}
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
		if (this.callTypeSelection.current) {
			this.callTypeSelection.current.disabled = true;
		}
		this.userHandler?.register();
	}

	unregisterEndpoint(): void {
		if (this.callTypeSelection.current) {
			this.callTypeSelection.current.disabled = false;
		}
		this.userHandler?.unregister();
		this.resetUserAgent();
	}

	async acceptCall(): Promise<any> {
		return this.userHandler?.acceptCall();
	}

	async rejectCall(): Promise<any> {
		return this.userHandler?.rejectCall();
	}

	async endCall(): Promise<any> {
		return this.userHandler?.endCall();
	}

	onChange(): void {
		if (this.callTypeSelection.current?.value) {
			this.setState({ enableVideo: this.callTypeSelection.current?.checked });
		}
	}

	render(): any {
		return (
			<div
				style={{
					marginLeft: '3%',
					marginTop: '3%',
					scrollBehavior: 'initial',
					overflowY: 'scroll',
				}}
			>
				<div>
					{this.state.enableVideo ? (
						<video id='remote_video' style={{ width: '50%', border: '1px solid #FF0000' }}></video>
					) : (
						<audio id='remote_video' style={{ width: '50%', border: '1px solid #FF0000' }}></audio>
					)}

					<div className='rcx-box rcx-box--full rcx-css-25ncok'>
						<div className='rcx-box rcx-box--full'>Enable Video</div>
						<label className='rcx-box rcx-box--full rcx-label rcx-box rcx-box--full rcx-toggle-switch'>
							<input
								type='checkbox'
								className='rcx-box rcx-box--full rcx-toggle-switch__input'
								defaultChecked
								ref={this.callTypeSelection}
								onChange={this.onChange.bind(this)}
							/>
							<i aria-hidden='true' className='rcx-box rcx-box--full rcx-toggle-switch__fake' />
						</label>
					</div>
					<div
						style={{ width: '20%' }}
						className='rcx-box rcx-box--full rcx-field rcx-field-group__item'
					>
						<label className='rcx-box rcx-box--full rcx-label rcx-box rcx-box--full rcx-field__label'>
							SIP User Name
						</label>
						<span className='rcx-box rcx-box--full rcx-field__row'>
							<input
								className='rcx-box rcx-box--full rcx-box--animated rcx-input-box--type-text rcx-input-box rcx-css-t3n91h'
								type='text'
								ref={this.userName}
								size={1}
								defaultValue='80000'
							/>
						</span>
					</div>
					<div
						style={{ width: '20%' }}
						className='rcx-box rcx-box--full rcx-field rcx-field-group__item'
					>
						<label className='rcx-box rcx-box--full rcx-label rcx-box rcx-box--full rcx-field__label'>
							SIP Password
						</label>
						<span className='rcx-box rcx-box--full rcx-field__row'>
							<input
								className='rcx-box rcx-box--full rcx-box--animated rcx-input-box--type-text rcx-input-box rcx-css-t3n91h'
								type='text'
								ref={this.password}
								size={1}
								defaultValue='1234'
							/>
						</span>
					</div>
					<div
						style={{ width: '20%' }}
						className='rcx-box rcx-box--full rcx-field rcx-field-group__item'
					>
						<label className='rcx-box rcx-box--full rcx-label rcx-box rcx-box--full rcx-field__label'>
							SIP Registrar
						</label>
						<span className='rcx-box rcx-box--full rcx-field__row'>
							<input
								className='rcx-box rcx-box--full rcx-box--animated rcx-input-box--type-text rcx-input-box rcx-css-t3n91h'
								type='text'
								ref={this.registrar}
								size={1}
								defaultValue='omni-asterisk.dev.rocket.chat'
							/>
						</span>
					</div>
					<div
						style={{ width: '20%' }}
						className='rcx-box rcx-box--full rcx-field rcx-field-group__item'
					>
						<label className='rcx-box rcx-box--full rcx-label rcx-box rcx-box--full rcx-field__label'>
							SIP WebSocket URI
						</label>
						<span className='rcx-box rcx-box--full rcx-field__row'>
							<input
								className='rcx-box rcx-box--full rcx-box--animated rcx-input-box--type-text rcx-input-box rcx-css-t3n91h'
								type='text'
								ref={this.webSocketPath}
								size={1}
								defaultValue='wss://omni-asterisk.dev.rocket.chat/ws'
							/>
						</span>
					</div>
				</div>
				<div style={{ marginTop: '20px', marginBottom: '30px' }}>
					<button
						style={{ width: '10%', marginTop: '5px', border: '2px solid green' }}
						className='btn rcx-box rcx-box--full rcx-box--animated rcx-button--small-square rcx-button--square rcx-button--small rcx-button--ghost rcx-button rcx-button-group__item rcx-css-ue04py'
						id='register'
						onClick={this.registerEndpoint.bind(this)}
					>
						Register
					</button>
					<button
						style={{ width: '10%', marginTop: '5px', border: '2px solid green' }}
						className='rcx-box rcx-box--full rcx-box--animated rcx-button--small-square rcx-button--square rcx-button--small rcx-button--ghost rcx-button rcx-button-group__item rcx-css-ue04py'
						id='unregister'
						onClick={this.unregisterEndpoint.bind(this)}
					>
						UnRegister
					</button>
					<button
						style={{ width: '10%', marginTop: '5px', border: '2px solid green' }}
						className='rcx-box rcx-box--full rcx-box--animated rcx-button--small-square rcx-button--square rcx-button--small rcx-button--ghost rcx-button rcx-button-group__item rcx-css-ue04py'
						id='accept_call'
						onClick={this.acceptCall.bind(this)}
					>
						Accept Call
					</button>
					<button
						style={{ width: '10%', marginTop: '5px', border: '2px solid green' }}
						className='rcx-box rcx-box--full rcx-box--animated rcx-button--small-square rcx-button--square rcx-button--small rcx-button--ghost rcx-button rcx-button-group__item rcx-css-ue04py'
						id='reject_call'
						onClick={this.rejectCall.bind(this)}
					>
						Reject Call
					</button>
					<button
						style={{ width: '10%', marginTop: '5px', border: '2px solid green' }}
						className='rcx-box rcx-box--full rcx-box--animated rcx-button--small-square rcx-button--square rcx-button--small rcx-button--ghost rcx-button rcx-button-group__item rcx-css-ue04py'
						id='end_call'
						onClick={this.endCall.bind(this)}
					>
						End Call
					</button>
				</div>
			</div>
		);
	}
}
export default VoIPLayout;
