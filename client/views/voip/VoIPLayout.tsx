import {
	ToggleSwitch,
	Field,
	FieldGroup,
	TextInput,
	Box,
	ActionButton,
} from '@rocket.chat/fuselage';
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
		<Box width='70%' m='auto'>
			<FieldGroup>

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

				<Field>
					<Field.Label>Enable Video</Field.Label>
					<ToggleSwitch defaultChecked onChange={onChange} disabled={!registered} />
				</Field>
				<Field>
					{state.state === 'IN_CALL' && (
						<Field.Label>Call from {state.callerInfo.callerName}</Field.Label>
					)}

					<Field.Label>SIP User Name</Field.Label>
					<Field>
						<TextInput
							value={extensionConfig?.extensionDetails.extension}
							disabled={Boolean(extensionConfig?.extensionDetails.extension)}
						/>
					</Field>
				</Field>
				<Field>
					<Field.Label>SIP Password</Field.Label>
					<TextInput
						value={extensionConfig?.extensionDetails.password}
						disabled={Boolean(extensionConfig?.extensionDetails.password)}
					/>
				</Field>
				<Field>
					<Field.Label>SIP Registrar</Field.Label>
					<TextInput value={extensionConfig?.host} disabled={Boolean(extensionConfig?.host)} />
				</Field>
				<Field>
					<Field.Label>SIP WebSocket URI</Field.Label>
					<Field>
						<TextInput
							value={extensionConfig?.callServerConfig.websocketPath}
							disabled={Boolean(extensionConfig?.callServerConfig.websocketPath)}
						/>
					</Field>
				</Field>
			</FieldGroup>
			<FieldGroup style={{ marginTop: '20px', marginBottom: '30px' }}>
				{state.state === 'OFFER_RECEIVED' && (
					<ActionButton icon='phone' id='accept_call' onClick={onAcceptCall}>
						Accept Call
					</ActionButton>
				)}
				{state.state === 'OFFER_RECEIVED' && (
					<ActionButton icon='phone-off' id='reject_call' onClick={onRejectCall}>
						Reject Call
					</ActionButton>
				)}
				{state.state === 'IN_CALL' && (
					<ActionButton icon='phone-off' id='end_call' onClick={onEndCall}>
						End Call
					</ActionButton>
				)}
			</FieldGroup>
		</Box>
	);
};
export default VoIPLayout;
