import { WorkflowTypes, IDevice, IMediaStreamRenderer, ISelectedDevices, VoIPUserConfiguration } from '@rocket.chat/core-typings';
import React, { ReactElement } from 'react';

import { APIClient } from '../../../app/utils/client/lib/RestApiClient';
import { ClientLogger } from '../../../lib/ClientLogger';
import { SimpleVoipUser } from '../../lib/voip/SimpleVoipUser';
import { VoIPUser } from '../../lib/voip/VoIPUser';

interface IState {
	isReady?: boolean;
	enableVideo?: boolean;
}

class VoipLayout extends React.Component<{}, IState> {
	extensionConfig: any;

	userHandler: VoIPUser | undefined;

	userName: React.RefObject<HTMLInputElement>;

	calledParty: React.RefObject<HTMLInputElement>;

	password: React.RefObject<HTMLInputElement>;

	registrar: React.RefObject<HTMLInputElement>;

	webSocketPath: React.RefObject<HTMLInputElement>;

	callTypeSelection: React.RefObject<HTMLInputElement>;

	config: VoIPUserConfiguration = {
		authUserName: '',
		authPassword: '',
		sipRegistrarHostnameOrIP: '',
		iceServers: [],
		connectionRetryCount: 0,
		enableKeepAliveUsingOptionsForUnstableNetworks: false,
	};

	logger: ClientLogger;

	constructor() {
		super({});
		this.state = {
			isReady: false,
			enableVideo: false,
		};
		this.userName = React.createRef();
		this.calledParty = React.createRef();
		this.password = React.createRef();
		this.registrar = React.createRef();
		this.webSocketPath = React.createRef();
		this.callTypeSelection = React.createRef();
		this.logger = new ClientLogger('VoIPLayout');
		this.extensionConfig = null;
	}

	// eslint-disable-next-line @typescript-eslint/camelcase
	private async _apitest_debug(): Promise<void> {
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
			this.logger.error('error in API');
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
			this.logger.error('error in API');
		}

		try {
			this.logger.info('Executing voipServerConfig.management');
			const output = await APIClient.v1.get('voipServerConfig.management');
			this.logger.info('voipServerConfig.management output = ', JSON.stringify(output));
		} catch (error) {
			this.logger.error('error in API');
		}
		try {
			this.logger.info('Executing voipServerConfig.callServer');
			const output = await APIClient.v1.get('voipServerConfig.callServer');
			this.logger.info('voipServerConfig.callServer output = ', JSON.stringify(output));
		} catch (error) {
			this.logger.error('error in API');
		}
		try {
			this.logger.info('Executing connector.extension.list');
			const list = await APIClient.v1.get('connector.extension.list');
			this.logger.info('connector.extension.list output = ', JSON.stringify(list));
		} catch (error) {
			this.logger.error('error in API');
		}
		try {
			this.logger.info('Executing queues.getSummary');
			const list = await APIClient.v1.get('voip/queues.getSummary');
			this.logger.info('queues.getSummary output = ', JSON.stringify(list));
		} catch (error) {
			this.logger.error('error in API');
		}
		try {
			this.logger.info('Executing queues.getQueuedCallsForThisExtension');
			const list = await APIClient.v1.get('voip/queues.getQueuedCallsForThisExtension', {
				extension: '80000',
			});
			this.logger.info('queues.getQueuedCallsForThisExtension output = ', JSON.stringify(list));
		} catch (error) {
			this.logger.error('error in API');
		}
		*/
	}

	private async initUserAgent(): Promise<void> {
		let extension = '80000';
		if (this.userName.current && this.userName.current.value) {
			extension = this.userName.current.value;
		}
		try {
			this.extensionConfig = await APIClient.v1.get('connector.extension.getRegistrationInfoByExtension', {
				extension,
			});
			this.logger.info('list = ', JSON.stringify(this.extensionConfig));
		} catch (error) {
			this.logger.error('error in API');
			throw error;
		}

		if (this.extensionConfig.extensionDetails.extension && this.userName.current) {
			this.userName.current.textContent = this.extensionConfig.extensionDetails.extension;
			this.userName.current.disabled = true;
			this.config.authUserName = this.extensionConfig.extensionDetails.extension;
		}
		if (this.extensionConfig.extensionDetails.password && this.password.current) {
			this.password.current.value = this.extensionConfig.extensionDetails.password;
			this.password.current.disabled = true;
			this.config.authPassword = this.extensionConfig.extensionDetails.password;
		}
		if (this.extensionConfig.host && this.registrar.current) {
			this.registrar.current.value = this.extensionConfig.host;
			this.registrar.current.disabled = true;
			this.config.sipRegistrarHostnameOrIP = this.extensionConfig.host;
		}
		if (this.extensionConfig.callServerConfig.websocketPath && this.webSocketPath.current) {
			this.webSocketPath.current.value = this.extensionConfig.callServerConfig.websocketPath;
			this.webSocketPath.current.disabled = true;
			this.config.webSocketURI = this.extensionConfig.callServerConfig.websocketPath;
		}

		this.config.enableVideo = this.state.enableVideo;
		/**
		 * Note : Following hardcoding needs to be removed. Where to get this data from, needs to
		 * be decided. Administration -> RateLimiter -> WebRTC has a setting for stun/turn servers.
		 * Nevertheless, whether it is configurebla by agent or not is to be found out.
		 * Agent will control these settings.
		 */
		this.config.iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
		// this.userHandler = await SimpleVoipUser.create(extension, password, host, websocketPath, iceServers, 'video');
		this.userHandler = await SimpleVoipUser.create(
			extension,
			this.config.authPassword,
			this.config.sipRegistrarHostnameOrIP,
			this.extensionConfig.callServerConfig.websocketPath,
			this.config.iceServers,
			-1,
			true,
			'audio',
		);
		this.userHandler.setWorkflowMode(WorkflowTypes.CONTACT_CENTER_USER);
		// this.userHandler.on('connected', this.onConnected.bind(this));
		this.userHandler.on('registered', this.onRegistered.bind(this));
		this.userHandler.on('registrationerror', this.onRegistrationError.bind(this));
		this.userHandler.on('unregistered', this.onUnregistered.bind(this));
		this.userHandler.on('unregistrationerror', this.onUnregistrationError.bind(this));
		this.userHandler.on('callestablished', this.onCallEstablished.bind(this));
		this.userHandler.onDeviceEvent('devicechanged', this.onDeviceChange.bind(this));
		this.onConnected();
	}

	private async resetUserAgent(): Promise<void> {
		this.extensionConfig = null;
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
		element = document.getElementById('call');
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
		await this._apitest_debug();
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
				this.populateMediaDevices();
			} catch (error) {
				this.logger.error('componentDidMount() Error in getting extension Info', error);
				throw error;
			}
		}
	}

	async registerEndpoint(): Promise<void> {
		// await this._apitest_debug();
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
		const videoElement = document.getElementById('remote_media') as HTMLMediaElement;
		const mediaRenderer: IMediaStreamRenderer = {
			remoteMediaElement: videoElement,
		};
		return this.userHandler?.acceptCall(mediaRenderer);
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

	/* Device Selection Code BEGIN*/
	async onDeviceChange(): Promise<void> {
		await this.populateMediaDevices();
	}

	async populateMediaDevices(): Promise<void> {
		if (!this.userHandler) {
			return;
		}
		const mediaDevices = await this.userHandler.getAvailableDevices();
		const audioInputDevice = document.getElementById('audio_input_devices') as HTMLSelectElement;
		const audioOutputDevices = document.getElementById('audio_output_devices') as HTMLSelectElement;
		const videoDevices = document.getElementById('video_devices') as HTMLSelectElement;
		if (audioInputDevice) {
			$(audioInputDevice).empty();
		}
		if (audioOutputDevices) {
			$(audioOutputDevices).empty();
		}
		if (videoDevices) {
			$(videoDevices).empty();
		}
		if (mediaDevices) {
			mediaDevices.audioInputDevices.forEach((device: IDevice) => {
				const option = new Option(device.label, device.id);
				audioInputDevice.add(option);
			});

			mediaDevices.audioOutputDevices.forEach((device: IDevice) => {
				const option = new Option(device.label, device.id);
				audioOutputDevices.add(option);
			});

			mediaDevices.videoInputDevices.forEach((device: IDevice) => {
				const option = new Option(device.label, device.id);
				videoDevices.add(option);
			});
		}
	}

	getSelectedDevices(): ISelectedDevices {
		const audioInputDevice = document.getElementById('audio_input_devices') as HTMLSelectElement;
		let value = audioInputDevice?.options[audioInputDevice.selectedIndex].value;
		let label = audioInputDevice?.options[audioInputDevice.selectedIndex].text;
		const audioInput: IDevice = {
			id: value,
			label,
			type: '',
		};
		const audioOutputDevice = document.getElementById('audio_output_devices') as HTMLSelectElement;
		value = audioOutputDevice?.options[audioOutputDevice.selectedIndex].value;
		label = audioOutputDevice?.options[audioOutputDevice.selectedIndex].text;
		const audioOutput: IDevice = {
			id: value,
			label,
			type: '',
		};
		return { audioInputDevice: audioInput, audioOutputDevice: audioOutput };
	}

	async onDeviceSelectionChange(deviceType: string): Promise<void> {
		if (deviceType === 'audio-input') {
			const audioInputDevice = document.getElementById('audio_input_devices') as HTMLSelectElement;
			const audioInput: IDevice = {
				id: audioInputDevice?.options[audioInputDevice.selectedIndex].value,
				label: audioInputDevice?.options[audioInputDevice.selectedIndex].text,
				type: '',
			};
			await this.userHandler?.changeAudioInputDevice(audioInput);
		} else if (deviceType === 'audio-output') {
			const audioOutputDevice = document.getElementById('audio_output_devices') as HTMLSelectElement;
			const audioOutput: IDevice = {
				id: audioOutputDevice?.options[audioOutputDevice.selectedIndex].value,
				label: audioOutputDevice?.options[audioOutputDevice.selectedIndex].text,
				type: '',
			};
			this.userHandler?.changeAudioOutputDevice(audioOutput);
		} else if (deviceType === 'video-input') {
			const videoInputDevice = document.getElementById('video_devices') as HTMLSelectElement;
			const audioInput: IDevice = {
				id: videoInputDevice?.options[videoInputDevice.selectedIndex].value,
				label: videoInputDevice?.options[videoInputDevice.selectedIndex].text,
				type: '',
			};
			await this.userHandler?.changeVideoInputDevice(audioInput);
		}
	}

	/* Device Selection Code END*/
	render(): ReactElement {
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
						<video id='remote_media' style={{ width: '50%', border: '1px solid #FF0000' }}></video>
					) : (
						<audio id='remote_media' style={{ width: '50%', border: '1px solid #FF0000' }}></audio>
					)}

					<div className='rcx-box rcx-box--full rcx-css-25ncok'>
						<div className='rcx-box rcx-box--full'>Enable Video</div>
						<label className='rcx-box rcx-box--full rcx-label rcx-box rcx-box--full rcx-toggle-switch'>
							<input
								type='checkbox'
								className='rcx-box rcx-box--full rcx-toggle-switch__input'
								ref={this.callTypeSelection}
								onChange={this.onChange.bind(this)}
							/>
							<i aria-hidden='true' className='rcx-box rcx-box--full rcx-toggle-switch__fake' />
						</label>
					</div>
					<div className='rcx-box rcx-box--full rcx-css-25ncok'>
						<div className='rcx-box rcx-box--full'>Audio Input Devices</div>
						<label className='rcx-box rcx-box--full rcx-label rcx-box rcx-box--full rcx-toggle-switch'>
							<select
								id='audio_input_devices'
								onChange={this.onDeviceSelectionChange.bind(this, 'audio-input')}
								style={{ width: '20%', height: '10%' }}
								className='rcx-box rcx-box--full rcx-box--animated rcx-input-box--type-text rcx-input-box rcx-css-t3n91h'
							>
								<option value='Audio device1'> Audio device 1 </option>
								<option value='Audio device2'> Audio device 2 </option>
							</select>
						</label>
					</div>
					<div className='rcx-box rcx-box--full rcx-css-25ncok'>
						<div className='rcx-box rcx-box--full'>Audio Output Devices</div>
						<label className='rcx-box rcx-box--full rcx-label rcx-box rcx-box--full rcx-toggle-switch'>
							<select
								id='audio_output_devices'
								onChange={this.onDeviceSelectionChange.bind(this, 'audio-output')}
								style={{ width: '20%', height: '10%' }}
								className='rcx-box rcx-box--full rcx-box--animated rcx-input-box--type-text rcx-input-box rcx-css-t3n91h'
							>
								<option value='Audio device1'> Audio device 1 </option>
								<option value='Audio device2'> Audio device 2 </option>
							</select>
						</label>
					</div>
					<div className='rcx-box rcx-box--full rcx-css-25ncok'>
						<div className='rcx-box rcx-box--full'>Video Devices</div>
						<label className='rcx-box rcx-box--full rcx-label rcx-box rcx-box--full rcx-toggle-switch'>
							<select
								id='video_devices'
								onChange={this.onDeviceSelectionChange.bind(this, 'video-input')}
								style={{ width: '20%', height: '10%' }}
								className='rcx-box rcx-box--full rcx-box--animated rcx-input-box--type-text rcx-input-box rcx-css-t3n91h'
							>
								<option value='Video device1'> Video device 1 </option>
								<option value='Video device2'> Video device 2 </option>
							</select>
						</label>
					</div>

					<div style={{ width: '20%' }} className='rcx-box rcx-box--full rcx-field rcx-field-group__item'>
						<label className='rcx-box rcx-box--full rcx-label rcx-box rcx-box--full rcx-field__label'>SIP User Name</label>
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
					<div style={{ width: '20%' }} className='rcx-box rcx-box--full rcx-field rcx-field-group__item'>
						<label className='rcx-box rcx-box--full rcx-label rcx-box rcx-box--full rcx-field__label'>SIP User Name</label>
						<span className='rcx-box rcx-box--full rcx-field__row'>
							<input
								className='rcx-box rcx-box--full rcx-box--animated rcx-input-box--type-text rcx-input-box rcx-css-t3n91h'
								type='text'
								ref={this.calledParty}
								size={1}
								/* defaultValue='sip:*5551981101007@omni-asterisk.dev.rocket.chat' */
								defaultValue='sip:80004@omni-asterisk.dev.rocket.chat'
							/>
						</span>
					</div>
					<div style={{ width: '20%' }} className='rcx-box rcx-box--full rcx-field rcx-field-group__item'>
						<label className='rcx-box rcx-box--full rcx-label rcx-box rcx-box--full rcx-field__label'>SIP Password</label>
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
					<div style={{ width: '20%' }} className='rcx-box rcx-box--full rcx-field rcx-field-group__item'>
						<label className='rcx-box rcx-box--full rcx-label rcx-box rcx-box--full rcx-field__label'>SIP Registrar</label>
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
					<div style={{ width: '20%' }} className='rcx-box rcx-box--full rcx-field rcx-field-group__item'>
						<label className='rcx-box rcx-box--full rcx-label rcx-box rcx-box--full rcx-field__label'>SIP WebSocket URI</label>
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
export default VoipLayout;
