import React from 'react';

import { ICallEventDelegate } from '../../components/voip/ICallEventDelegate';
import { IConnectionDelegate } from '../../components/voip/IConnectionDelegate';
import { IRegisterHandlerDelegate } from '../../components/voip/IRegisterHandlerDelegate';
import { VoIPUser } from '../../components/voip/VoIPUser';
import { VoIPUserConfiguration } from '../../components/voip/VoIPUserConfiguration';
import { Logger } from '../../components/voip/utils/Logger';

interface IState {
	isReady?: boolean;
	enableVideo?: boolean;
}

class VoIPLayout
	extends React.Component<{}, IState>
	implements IRegisterHandlerDelegate, IConnectionDelegate, ICallEventDelegate
{
	userHandler: VoIPUser | undefined;

	userName: React.RefObject<HTMLInputElement>;

	password: React.RefObject<HTMLInputElement>;

	registrar: React.RefObject<HTMLInputElement>;

	webSocketPath: React.RefObject<HTMLInputElement>;

	callTypeSelection: React.RefObject<HTMLInputElement>;

	config: VoIPUserConfiguration = {};

	logger: Logger | undefined;

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
		this.logger = new Logger('VoIPLayout');
	}

	/* RegisterHandlerDeligate implementation begin */
	onRegistered(): void {
		this.logger?.info('onRegistered');
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
		this.logger?.error(`onRegistrationError${reason}`);
	}

	onUnregistered(): void {
		this.logger?.debug('onUnregistered');
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
		this.logger?.error('onUnregistrationError');
	}
	/* RegisterHandlerDeligate implementation end */

	/* ConnectionDelegate implementation begin */
	onConnected(): void {
		this.logger?.debug('onConnected');
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
		this.logger?.error(`onConnectionError${error}`);
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

		if (this.userName.current?.textContent) {
			this.config.authUserName = this.userName.current?.textContent;
		} else {
			this.config.authUserName = this.userName.current?.defaultValue;
		}
		if (this.password.current?.textContent) {
			this.config.authPassword = this.password.current?.textContent;
		} else {
			this.config.authPassword = this.password.current?.defaultValue;
		}
		if (this.registrar.current?.textContent) {
			this.config.sipRegistrarHostnameOrIP = this.registrar.current?.textContent;
		} else {
			this.config.sipRegistrarHostnameOrIP = this.registrar.current?.defaultValue;
		}
		if (this.webSocketPath.current?.textContent) {
			this.config.webSocketURI = this.webSocketPath.current?.textContent;
		} else {
			this.config.webSocketURI = this.webSocketPath.current?.defaultValue;
		}

		this.config.enableVideo = this.state.enableVideo;
		this.config.connectionDelegate = this;
		this.config.iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
		const videoElement = document.getElementById('remote_video') as HTMLMediaElement;
		if (videoElement) {
			this.config.mediaElements = {
				remoteStreamMediaElement: videoElement,
			};
		}

		this.userHandler = new VoIPUser(this.config, this, this, this);
		this.setState({ isReady: true });
		await this.userHandler?.init();
	}

	registerEndpoint(): void {
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
