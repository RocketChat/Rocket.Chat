import { ToggleSwitch } from '@rocket.chat/fuselage';
import React, { FC, useRef, useState, useCallback, useEffect, useMemo, FormEvent } from 'react';
import { useSubscription } from 'use-subscription';

// import { APIClient } from '../../../app/utils/client/lib/RestApiClient';
import { ClientLogger } from '../../../lib/ClientLogger';
import { VoIpCallerInfo, VoIPUser } from '../../components/voip/VoIPUser';
import { IMediaStreamRenderer } from '../../components/voip/VoIPUserConfiguration';
import { useRegistrationInfo } from '../../contexts/OmnichannelContext';

const VoIPLayout: FC<{
	voipUser: VoIPUser;
}> = ({ voipUser }) => {
	const [enableVideo, setEnableVideo] = useState(true);
	const extensionConfig = useRegistrationInfo();

	const remoteVideoMedia = useRef<HTMLVideoElement>(null);
	const remoteAudioMedia = useRef<HTMLAudioElement>(null);

	const subscription = useMemo(
		() => ({
			getCurrentValue: (): VoIpCallerInfo => voipUser.callerInfo,
			subscribe: (callback: () => void): (() => void) => {
				voipUser.on('stateChanged', callback);

				return (): void => {
					voipUser.off('stateChanged', callback);
				};
			},
		}),
		[voipUser],
	);

	const state = useSubscription(subscription);

	const [registered, setRegistered] = useState(false);

	const logger: ClientLogger = useMemo(() => new ClientLogger('VoIPLayout'), []);

	const onChange = useCallback((event: FormEvent<HTMLInputElement>): void => {
		setEnableVideo(event.currentTarget.checked);
	}, []);

	const registerCallback = useCallback((): void => {
		setRegistered(true);
		logger.debug('registerCallback');
	}, [logger]);

	const unregisterCallback = useCallback((): void => {
		setRegistered(false);
		logger.debug('unregisterCallback');
	}, [logger]);

	const errorCallback = useCallback((): void => {
		logger.debug('errorCallback');
	}, [logger]);

	const onAcceptCall = useCallback((): void => {
		logger.debug('onAcceptCall');
		const mediaElement = enableVideo ? remoteVideoMedia.current : remoteAudioMedia.current;
		const mediaRenderer: IMediaStreamRenderer = {
			remoteMediaElement: mediaElement as HTMLMediaElement,
		};
		voipUser.acceptCall(mediaRenderer);
	}, [enableVideo, logger, voipUser]);

	const onRejectCall = useCallback((): void => {
		logger.debug('onRejectCall');
		voipUser.rejectCall();
	}, [logger, voipUser]);

	const onEndCall = useCallback((): void => {
		logger.debug('onEndCall');
		voipUser.endCall();
	}, [logger, voipUser]);

	useEffect(() => {
		voipUser.on('registered', registerCallback);
		voipUser.on('unregistered', unregisterCallback);
		voipUser.on('registrationerror', errorCallback);
		voipUser.on('unregistrationerror', errorCallback);
		// voipUser.on('incomingcall', incomingCallCallback);
		// voipUser.on('callestablished', callEstablishedCallback);
		// voipUser.on('callterminated', callTerminationCallback);

		return (): void => {
			voipUser.off('registered', registerCallback);
			voipUser.off('unregistered', unregisterCallback);
			voipUser.off('registrationerror', errorCallback);
			voipUser.off('unregistrationerror', errorCallback);
			// voipUser.off('incomingcall', incomingCallCallback);
			// voipUser.off('callestablished', callEstablishedCallback);
			// voipUser.off('callterminated', callTerminationCallback);
		};
	}, [errorCallback, logger, registerCallback, unregisterCallback, voipUser]);

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
					<ToggleSwitch defaultChecked onChange={onChange} disabled={!registered} />
				</div>
				<div
					style={{ width: '20%' }}
					className='rcx-box rcx-box--full rcx-field rcx-field-group__item'
				>
					{state.state === 'IN_CALL' && (
						<label className='rcx-box rcx-box--full rcx-label rcx-box rcx-box--full rcx-field__label'>
							Call from {state.callerInfo.callerName}
						</label>
					)}

					<label className='rcx-box rcx-box--full rcx-label rcx-box rcx-box--full rcx-field__label'>
						SIP User Name
					</label>
					<span className='rcx-box rcx-box--full rcx-field__row'>
						<input
							className='rcx-box rcx-box--full rcx-box--animated rcx-input-box--type-text rcx-input-box rcx-css-t3n91h'
							type='text'
							size={1}
							disabled={Boolean(extensionConfig?.extensionDetails.extension)}
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
							size={1}
							disabled={Boolean(extensionConfig?.extensionDetails.password)}
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
							size={1}
							disabled={Boolean(extensionConfig?.host)}
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
							size={1}
							disabled={Boolean(extensionConfig?.callServerConfig.websocketPath)}
						/>
					</span>
				</div>
			</div>
			<div style={{ marginTop: '20px', marginBottom: '30px' }}>
				{state.state === 'OFFER_RECEIVED' && (
					<button
						style={{ width: '10%', marginTop: '5px', border: '2px solid green' }}
						className='rcx-box rcx-box--full rcx-box--animated rcx-button--small-square rcx-button--square rcx-button--small rcx-button--ghost rcx-button rcx-button-group__item rcx-css-ue04py'
						id='accept_call'
						onClick={onAcceptCall}
					>
						Accept Call
					</button>
				)}
				{state.state === 'OFFER_RECEIVED' && (
					<button
						style={{ width: '10%', marginTop: '5px', border: '2px solid green' }}
						className='rcx-box rcx-box--full rcx-box--animated rcx-button--small-square rcx-button--square rcx-button--small rcx-button--ghost rcx-button rcx-button-group__item rcx-css-ue04py'
						id='reject_call'
						onClick={onRejectCall}
					>
						Reject Call
					</button>
				)}
				{state.state === 'IN_CALL' && (
					<button
						style={{ width: '10%', marginTop: '5px', border: '2px solid green' }}
						className='rcx-box rcx-box--full rcx-box--animated rcx-button--small-square rcx-button--square rcx-button--small rcx-button--ghost rcx-button rcx-button-group__item rcx-css-ue04py'
						id='end_call'
						onClick={onEndCall}
					>
						End Call
					</button>
				)}
			</div>
		</div>
	);
};
export default VoIPLayout;
