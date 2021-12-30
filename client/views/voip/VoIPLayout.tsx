import { Meteor } from 'meteor/meteor';
import React, { FC, useRef, useState, useCallback, useEffect, useMemo } from 'react';

import { APIClient } from '../../../app/utils/client/lib/RestApiClient';
import { IOmnichannelRoom } from '../../../definition/IRoom';
import { IVisitor } from '../../../definition/IVisitor';
import { ClientLogger } from '../../../lib/ClientLogger';
import { ICallerInfo } from '../../components/voip/ICallEventDelegate';
import { VoipEvents } from '../../components/voip/SimpleVoipUser';
import { IMediaStreamRenderer } from '../../components/voip/VoIPUserConfiguration';
import { useVoipUser, useRegistrationInfo } from '../../contexts/OmnichannelContext';
import { createToken } from '../../lib/utils/createToken';

const VoIPLayout: FC = () => {
	const [enableVideo, setEnableVideo] = useState(true);
	const [initialised, setInitialised] = useState(false);
	const extensionConfig = useRegistrationInfo();
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
	const roomVisitorToken = createToken();
	let caller: ICallerInfo;
	let visitor: IVisitor;
	let room: IOmnichannelRoom;
	const logger: ClientLogger = useMemo(() => new ClientLogger('VoIPLayout'), []);
	const onChange = useCallback((): void => {
		if (callTypeSelection.current?.value) {
			setEnableVideo(callTypeSelection.current?.checked);
		}
	}, []);

	const apiTest = async (): Promise<void> => {
		/*
		try {
			logger.info('Executing voipServerConfig.callServer');
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
			logger.info('voipServerConfig.callServer output = ', JSON.stringify(output));
		} catch (error) {
			logger.error(`error ${error} in API voipServerConfig.callServer`);
		}
		try {
			logger.info('Executing voipServerConfig.management');
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
			logger.info('voipServerConfig.management output = ', JSON.stringify(output));
		} catch (error) {
			logger.error(`error ${error} in API voipServerConfig.management`);
		}
		*/
		try {
			logger.info('Executing connector.getVersion');
			const list = await APIClient.v1.get('connector.getVersion');
			logger.info('connector.getVersion output = ', JSON.stringify(list));
		} catch (error) {
			logger.error(`error ${error} in API connector.getVersion`);
		}
		try {
			logger.info('Executing voipServerConfig.management');
			const output = await APIClient.v1.get('voipServerConfig.management');
			logger.info('voipServerConfig.management output = ', JSON.stringify(output));
		} catch (error) {
			logger.error(`error ${error} in API voipServerConfig.management`);
		}
		try {
			logger.info('Executing voipServerConfig.callServer');
			const output = await APIClient.v1.get('voipServerConfig.callServer');
			logger.info('voipServerConfig.callServer output = ', JSON.stringify(output));
		} catch (error) {
			logger.error(`error ${error} in API voipServerConfig.callServer`);
		}

		try {
			logger.info('Executing queues.getSummary');
			const list = await APIClient.v1.get('voip/queues.getSummary');
			logger.info('queues.getSummary output = ', JSON.stringify(list));
		} catch (error) {
			logger.error(`error ${error} in API queues.getSummary`);
		}

		try {
			logger.info('Executing queues.getQueuedCallsForThisExtension');
			const list = await APIClient.v1.get('voip/queues.getQueuedCallsForThisExtension', {
				extension: '80000',
			});
			logger.info('queues.getQueuedCallsForThisExtension output = ', JSON.stringify(list));
		} catch (error) {
			logger.error(`error ${error} in API queues.getQueuedCallsForThisExtension`);
		}

		try {
			logger.info('Executing connector.extension.list');
			const list = await APIClient.v1.get('connector.extension.list');
			logger.info('connector.extension.list output = ', JSON.stringify(list));
		} catch (error) {
			logger.error(`error ${error} in API onnector.extension.list`);
		}

		try {
			logger.info('Executing connector.extension.getDetails');
			const list = await APIClient.v1.get('connector.extension.getDetails', {
				extension: '80000',
			});
			logger.info('connector.extension.getDetails output = ', JSON.stringify(list));
		} catch (error) {
			logger.error(`error ${error} in API connector.extension.getDetails`);
		}

		try {
			logger.info('Executing connector.extension.getRegistrationInfo');
			const userIdentity = await APIClient.v1.get('connector.extension.getRegistrationInfo', {
				extension: '80000',
			});
			logger.info('list = ', JSON.stringify(userIdentity));
		} catch (error) {
			logger.error(`error ${error} in API connector.extension.getRegistrationInfo`);
		}

		try {
			logger.info('Executing POST omnichannel/agent/extension');
			const userIdentity = await APIClient.v1.post(
				'omnichannel/agent/extension',
				{},
				{
					username: 'amol.associate',
					extension: '80001',
				},
			);
			logger.info('list = ', JSON.stringify(userIdentity));
		} catch (error) {
			logger.error(`error ${error} in API agent.extension`);
		}

		try {
			logger.info('Executing GET omnichannel/agent/extension');
			const extension = await APIClient.v1.get('omnichannel/agent/extension', {
				username: 'amol.associate',
			});
			logger.info('list = ', JSON.stringify(extension));
		} catch (error) {
			logger.error(`error ${error} in API agent.extension`);
		}
		/*
		try {
			logger.info('Executing delete omnichannel/agent/extension');
			const result = await APIClient.v1.delete('omnichannel/agent/extension', {
				username: 'amol.associate',
			});
			logger.info('list = ', JSON.stringify(result));
		} catch (error) {
			logger.error(`error ${error} in API agent.extension`);
		}
		// Set it again for verifying methods below

		try {
			logger.info('Executing POST omnichannel/agent/extension');
			const userIdentity = await APIClient.v1.post(
				'omnichannel/agent/extension',
				{},
				{
					username: 'amol.associate1',
					extension: '80000',
				},
			);
			logger.info('list = ', JSON.stringify(userIdentity));
		} catch (error) {
			logger.error(`error ${error} in API agent.extension`);
		}
		*/
		try {
			logger.info('Executing GET omnichannel/extension?type=free');
			const extension = await APIClient.v1.get('omnichannel/extension?type=free');
			logger.info('list = ', JSON.stringify(extension));
		} catch (error) {
			logger.error(`error ${error} in API agent.extension`);
		}

		try {
			logger.info('Executing GET omnichannel/extension?type=allocated');
			const extension = await APIClient.v1.get('omnichannel/extension?type=allocated');
			logger.info('list = ', JSON.stringify(extension));
		} catch (error) {
			logger.error(`error ${error} in API agent.extension`);
		}

		try {
			logger.info('Executing GET omnichannel/extension?type=available&username=amol.associate');
			const extension = await APIClient.v1.get(
				'omnichannel/extension?type=available&username=amol.associate',
			);
			logger.info('list = ', JSON.stringify(extension));
		} catch (error) {
			logger.error(`error ${error} in API agent.extension`);
		}
	};
	const testVoipRooms = async (): Promise<void> => {
		const token = createToken();
		try {
			logger.info('Executing POST livechat/visitor');
			const output = await APIClient.v1.post(
				'livechat/visitor',
				{},
				{
					visitor: {
						id: createToken(),
						token,
						name: 'amol-livechat-user',
						phone: '+919421203308',
					},
				},
			);
			logger.info('livechat/visitor output = ', JSON.stringify(output));
		} catch (error) {
			logger.error(`error ${error} in API POST livechat/visitor`);
		}

		try {
			logger.info('Executing GET voip/room');
			const output = await APIClient.v1.get(`voip/room`, { token, agentId: 'JrQAQF5xwMe3AdbKL' });
			logger.info('GET voip/visitor output = ', JSON.stringify(output));
		} catch (error) {
			logger.error(`error ${error} in API GET voip/room`);
		}

		try {
			logger.info('Executing GET livechat/visitor');
			const output = await APIClient.v1.get(`livechat/visitor/${token}`);
			logger.info('GET livechat/visitor output = ', JSON.stringify(output));
		} catch (error) {
			logger.error(`error ${error} in API GET livechat/visitor`);
		}

		try {
			logger.info('Executing DELETE livechat/visitor');
			const output = await APIClient.v1.delete(`livechat/visitor/${token}`);
			logger.info('DELETE livechat/visitor output = ', JSON.stringify(output));
		} catch (error) {
			logger.error(`error ${error} in API DELETE livechat/visitor`);
		}
	};
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
		caller = callerInfo;
	};

	const callEstablishedCallback = async (): Promise<void> => {
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
		try {
			// Create a new visitor
			logger.info('Creating new visitor');
			visitor = await APIClient.v1.post(
				'livechat/visitor',
				{},
				{
					visitor: {
						id: createToken(),
						token: roomVisitorToken,
						name: caller.callerName,
						phone: caller.callerId,
					},
				},
			);
			logger.info('Created new Visitor = ', JSON.stringify(visitor));

			// Now create a new room
			logger.info('Creatring a new room');
			const output = await APIClient.v1.get('voip/room', {
				token: roomVisitorToken,
				// agentId: 'JrQAQF5xwMe3AdbKL',
				agentId: Meteor.userId(),
			});
			room = output.room;
			logger.info('New Room created', JSON.stringify(room));
		} catch (error) {
			logger.error(`error ${error} in vhile creating the room`);
			throw error;
		}
	};

	const callTerminationCallback = async (): Promise<void> => {
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
		// Call is terminated. Now close the room

		try {
			logger.info('Closing the room');
			const output = await APIClient.v1.post(
				'voip/room.close',
				{},
				{
					rid: room._id,
					token: roomVisitorToken,
				},
			);
			logger.info('Closed room Result = ', JSON.stringify(output));
		} catch (error) {
			logger.error(`error ${error} in Closing the room`);
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

	const setupHandlers = (): void => {
		if (!voipUser || initialised) {
			return;
		}
		setInitialised(true);
		voipUser?.setListener(VoipEvents.registered, registerCallback);
		voipUser?.setListener(VoipEvents.unregistered, unregisterCallback);
		voipUser?.setListener(VoipEvents.registrationerror, errorCallback);
		voipUser?.setListener(VoipEvents.unregistrationerror, errorCallback);
		voipUser?.setListener(VoipEvents.incomingcall, incomingCallCallback);
		voipUser?.setListener(VoipEvents.callestablished, callEstablishedCallback);
		voipUser?.setListener(VoipEvents.callterminated, callTerminationCallback);
	};

	useEffect(() => {
		apiTest();
		if (extensionConfig?.extensionDetails.extension && userName.current) {
			userName.current.value = extensionConfig.extensionDetails.extension;
			userName.current.disabled = true;
		}
		if (extensionConfig?.extensionDetails.password && password.current) {
			password.current.value = extensionConfig.extensionDetails.password;
			password.current.disabled = true;
		}
		if (extensionConfig?.host && registrar.current) {
			registrar.current.value = extensionConfig.host;
			registrar.current.disabled = true;
		}
		if (extensionConfig?.callServerConfig.websocketPath && webSocketPath.current) {
			webSocketPath.current.value = extensionConfig.callServerConfig.websocketPath;
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
		setupHandlers();
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
					id='test-room'
					onClick={testVoipRooms}
				>
					Test Room
				</button>
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
