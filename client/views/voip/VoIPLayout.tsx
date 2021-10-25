import React, { FC, useRef, useState, useCallback, useEffect, useMemo } from 'react';

import { ClientLogger } from '../../../lib/ClientLogger';
import { ICallerInfo } from '../../components/voip/ICallEventDelegate';
import { VoipEvents } from '../../components/voip/SimpleVoipUser';
import { IMediaStreamRenderer } from '../../components/voip/VoIPUserConfiguration';
import { useVoipUser, useExtensionConfig } from '../../contexts/OmnichannelContext';

const VoIPLayout: FC = () => {
	const [enableVideo, setEnableVideo] = useState(true);
	const extensionConfig = useExtensionConfig();
	const voipUser = useVoipUser();
	const remoteVideoMedia = useRef<HTMLVideoElement>(null);
	const remoteAudioMedia = useRef<HTMLAudioElement>(null);
	const callTypeSelection = useRef<HTMLInputElement>(null);
	const callerId = useRef<HTMLLabelElement>(null);
	const userName = useRef<HTMLInputElement>(null);
	const password = useRef<HTMLInputElement>(null);
	const registrar = useRef<HTMLInputElement>(null);
	const webSocketPath = useRef<HTMLInputElement>(null);

	const acceptCall = useRef<HTMLButtonElement>(null);
	const rejectCall = useRef<HTMLButtonElement>(null);
	const endCall = useRef<HTMLButtonElement>(null);
	const logger: ClientLogger = useMemo(() => new ClientLogger('VoIPLayout'), []);
	const onChange = useCallback((): void => {
		if (callTypeSelection.current?.value) {
			setEnableVideo(callTypeSelection.current?.checked);
		}
	}, []);

	const registerCallback = (): void => {
		if (callTypeSelection.current) {
			callTypeSelection.current.disabled = true;
		}
		logger.debug('registerCallback');
	};

	const unregisterCallback = (): void => {
		if (callTypeSelection.current) {
			callTypeSelection.current.disabled = false;
		}
		logger.debug('unregisterCallback');
	};

	const errorCallback = (): void => {
		logger.debug('errorCallback');
	};

	const incomingCallCallback = (callerInfo: ICallerInfo): void => {
		logger.debug(`incomingCallCallback from ${callerInfo.callerName}`);
		if (acceptCall.current) {
			acceptCall.current.style.display = 'block';
		}
		if (rejectCall.current) {
			rejectCall.current.style.display = 'block';
		}
		if (callerId.current) {
			callerId.current.textContent = `Call from ${callerInfo.callerId}`;
		}
	};

	const callEstablishedCallback = (): void => {
		logger.debug('callEstablishedCallback');
		if (acceptCall.current) {
			acceptCall.current.style.display = 'none';
		}
		if (rejectCall.current) {
			rejectCall.current.style.display = 'none';
		}
		if (endCall.current) {
			endCall.current.style.display = 'block';
		}
	};

	const callTerminationCallback = (): void => {
		logger.debug('callTerminationCallback');
		if (acceptCall.current) {
			acceptCall.current.style.display = 'none';
		}
		if (rejectCall.current) {
			rejectCall.current.style.display = 'none';
		}
		if (endCall.current) {
			endCall.current.style.display = 'none';
		}
		if (callerId.current) {
			callerId.current.textContent = '';
		}
	};

	const onAcceptCall = useCallback((): void => {
		logger.debug('onAcceptCall');
		const mediaElement = enableVideo ? remoteVideoMedia.current : remoteAudioMedia.current;
		const mediaRenderer: IMediaStreamRenderer = {
			remoteMediaElement: mediaElement as HTMLMediaElement,
		};
		voipUser?.acceptCall(mediaRenderer);
	}, [enableVideo, logger, voipUser]);

	const onRejectCall = useCallback((): void => {
		logger.debug('onRejectCall');
		voipUser?.rejectCall();
	}, [logger, voipUser]);

	const onEndCall = useCallback((): void => {
		logger.debug('onEndCall');
		voipUser?.endCall();
	}, [logger, voipUser]);

	useEffect(() => {
		if (extensionConfig?.extension && userName.current) {
			userName.current.value = extensionConfig.extension;
			userName.current.disabled = true;
		}
		if (extensionConfig?.password && password.current) {
			password.current.value = extensionConfig.password;
			password.current.disabled = true;
		}
		if (extensionConfig?.sipRegistrar && registrar.current) {
			registrar.current.value = extensionConfig.sipRegistrar;
			registrar.current.disabled = true;
		}
		if (extensionConfig?.websocketUri && webSocketPath.current) {
			webSocketPath.current.value = extensionConfig.websocketUri;
			webSocketPath.current.disabled = true;
		}
		if (acceptCall.current) {
			acceptCall.current.style.display = 'none';
		}
		if (rejectCall.current) {
			rejectCall.current.style.display = 'none';
		}
		if (endCall.current) {
			endCall.current.style.display = 'none';
		}
		voipUser?.setListener(VoipEvents.registered, registerCallback);
		voipUser?.setListener(VoipEvents.unregistered, unregisterCallback);
		voipUser?.setListener(VoipEvents.registrationerror, errorCallback);
		voipUser?.setListener(VoipEvents.unregistrationerror, errorCallback);
		voipUser?.setListener(VoipEvents.incomingcall, incomingCallCallback);
		voipUser?.setListener(VoipEvents.callestablished, callEstablishedCallback);
		voipUser?.setListener(VoipEvents.callterminated, callTerminationCallback);
	});

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
				{enableVideo ? (
					<video
						id='remote_media'
						ref={remoteVideoMedia}
						style={{ width: '50%', border: '1px solid #FF0000' }}
					></video>
				) : (
					<audio
						id='remote_media'
						ref={remoteAudioMedia}
						style={{ width: '50%', border: '1px solid #FF0000' }}
					></audio>
				)}

				<div className='rcx-box rcx-box--full rcx-css-25ncok'>
					<div className='rcx-box rcx-box--full'>Enable Video</div>
					<label className='rcx-box rcx-box--full rcx-label rcx-box rcx-box--full rcx-toggle-switch'>
						<input
							type='checkbox'
							className='rcx-box rcx-box--full rcx-toggle-switch__input'
							defaultChecked
							ref={callTypeSelection}
							onChange={onChange}
						/>
						<i aria-hidden='true' className='rcx-box rcx-box--full rcx-toggle-switch__fake' />
					</label>
				</div>
				<div
					style={{ width: '20%' }}
					className='rcx-box rcx-box--full rcx-field rcx-field-group__item'
				>
					<label
						ref={callerId}
						className='rcx-box rcx-box--full rcx-label rcx-box rcx-box--full rcx-field__label'
					></label>
					<label className='rcx-box rcx-box--full rcx-label rcx-box rcx-box--full rcx-field__label'>
						SIP User Name
					</label>
					<span className='rcx-box rcx-box--full rcx-field__row'>
						<input
							className='rcx-box rcx-box--full rcx-box--animated rcx-input-box--type-text rcx-input-box rcx-css-t3n91h'
							type='text'
							ref={userName}
							size={1}
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
							ref={password}
							size={1}
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
							ref={registrar}
							size={1}
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
							ref={webSocketPath}
							size={1}
						/>
					</span>
				</div>
			</div>
			<div style={{ marginTop: '20px', marginBottom: '30px' }}>
				<button
					style={{ width: '10%', marginTop: '5px', border: '2px solid green' }}
					className='rcx-box rcx-box--full rcx-box--animated rcx-button--small-square rcx-button--square rcx-button--small rcx-button--ghost rcx-button rcx-button-group__item rcx-css-ue04py'
					id='accept_call'
					ref={acceptCall}
					onClick={onAcceptCall}
				>
					Accept Call
				</button>
				<button
					style={{ width: '10%', marginTop: '5px', border: '2px solid green' }}
					className='rcx-box rcx-box--full rcx-box--animated rcx-button--small-square rcx-button--square rcx-button--small rcx-button--ghost rcx-button rcx-button-group__item rcx-css-ue04py'
					id='reject_call'
					ref={rejectCall}
					onClick={onRejectCall}
				>
					Reject Call
				</button>
				<button
					style={{ width: '10%', marginTop: '5px', border: '2px solid green' }}
					className='rcx-box rcx-box--full rcx-box--animated rcx-button--small-square rcx-button--square rcx-button--small rcx-button--ghost rcx-button rcx-button-group__item rcx-css-ue04py'
					id='end_call'
					ref={endCall}
					onClick={onEndCall}
				>
					End Call
				</button>
			</div>
		</div>
	);
};
export default VoIPLayout;
