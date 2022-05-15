import { Box, Flex, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import React, { FC, useEffect, useState } from 'react';

import { Notifications } from '../../../app/notifications/client';
import { WebRTC } from '../../../app/webrtc/client';
import { WEB_RTC_EVENTS } from '../../../app/webrtc/index';
import UserAvatar from '../../components/avatar/UserAvatar';
import OngoingCallDuration from './OngoingCallDuration';
import './styles.css';

type CallPageProps = {
	roomId: any;
	visitorToken: any;
	visitorId: any;
	status: any;
	setStatus: any;
	layout: any;
	visitorName: any;
	agentName: any;
	callStartTime: any;
};

const CallPage: FC<CallPageProps> = ({
	roomId,
	visitorToken,
	visitorId,
	status,
	setStatus,
	layout,
	visitorName,
	agentName,
	callStartTime,
}) => {
	const [isAgentActive, setIsAgentActive] = useState(false);
	const [isMicOn, setIsMicOn] = useState(false);
	const [isCameraOn, setIsCameraOn] = useState(false);
	const [isRemoteMobileDevice, setIsRemoteMobileDevice] = useState(false);
	const [callInIframe, setCallInIframe] = useState(false);
	const [isRemoteCameraOn, setIsRemoteCameraOn] = useState(false);
	const [isLocalMobileDevice, setIsLocalMobileDevice] = useState(false);

	let iconSize = 'x21';
	let buttonSize = 'x40';
	const avatarSize = 'x48';
	if (layout === 'embedded') {
		iconSize = 'x19';
		buttonSize = 'x35';
	}

	const t = useTranslation();
	useEffect(() => {
		if (visitorToken) {
			const webrtcInstance = WebRTC.getInstanceByRoomId(roomId, visitorId);
			const isMobileDevice = (): boolean => {
				if (layout === 'embedded') {
					setCallInIframe(true);
				}
				if (window.innerWidth <= 450 && window.innerHeight >= 629 && window.innerHeight <= 900) {
					setIsLocalMobileDevice(true);
					webrtcInstance.media = {
						audio: true,
						video: {
							width: { ideal: 440 },
							height: { ideal: 580 },
						},
					};
					return true;
				}
				return false;
			};
			Notifications.onUser(
				WEB_RTC_EVENTS.WEB_RTC,
				(type: any, data: any) => {
					if (data.room == null) {
						return;
					}
					webrtcInstance.onUserStream(type, data);
				},
				visitorId,
			);
			Notifications.onRoom(roomId, 'webrtc', (type: any, data: any) => {
				if (type === 'callStatus' && data.callStatus === 'ended') {
					webrtcInstance.stop();
					setStatus(data.callStatus);
				} else if (type === 'getDeviceType') {
					Notifications.notifyRoom(roomId, 'webrtc', 'deviceType', {
						isMobileDevice: isMobileDevice(),
					});
				} else if (type === 'cameraStatus') {
					setIsRemoteCameraOn(data.isCameraOn);
				}
			});
			Notifications.notifyRoom(roomId, 'webrtc', 'deviceType', {
				isMobileDevice: isMobileDevice(),
			});
			Notifications.notifyRoom(roomId, 'webrtc', 'callStatus', { callStatus: 'inProgress' });
		} else if (!isAgentActive) {
			const webrtcInstance = WebRTC.getInstanceByRoomId(roomId);
			if (status === 'inProgress') {
				Notifications.notifyRoom(roomId, 'webrtc', 'getDeviceType');
				webrtcInstance.startCall({
					audio: true,
					video: {
						width: { ideal: 1920 },
						height: { ideal: 1080 },
					},
				});
			}
			Notifications.onRoom(roomId, 'webrtc', (type: any, data: any) => {
				if (type === 'callStatus') {
					switch (data.callStatus) {
						case 'ended':
							webrtcInstance.stop();
							break;
						case 'inProgress':
							webrtcInstance.startCall({
								audio: true,
								video: {
									width: { ideal: 1920 },
									height: { ideal: 1080 },
								},
							});
					}
					setStatus(data.callStatus);
				} else if (type === 'deviceType' && data.isMobileDevice) {
					setIsRemoteMobileDevice(true);
				} else if (type === 'cameraStatus') {
					setIsRemoteCameraOn(data.isCameraOn);
				}
			});
			setIsAgentActive(true);
		}
	}, [isAgentActive, status, setStatus, visitorId, roomId, visitorToken, layout]);

	const toggleButton = (control: any): any => {
		if (control === 'mic') {
			WebRTC.getInstanceByRoomId(roomId, visitorToken).toggleAudio();
			return setIsMicOn(!isMicOn);
		}
		WebRTC.getInstanceByRoomId(roomId, visitorToken).toggleVideo();
		setIsCameraOn(!isCameraOn);
		Notifications.notifyRoom(roomId, 'webrtc', 'cameraStatus', { isCameraOn: !isCameraOn });
	};

	const closeWindow = (): void => {
		if (layout === 'embedded') {
			return (parent as any)?.handleIframeClose();
		}
		return window.close();
	};

	const getCallDuration = (callStartTime: any): any => moment.duration(moment(new Date()).diff(moment(callStartTime))).asSeconds();

	const showCallPage = (localAvatar: any, remoteAvatar: any): any => (
		<Flex.Container direction='column' justifyContent='center'>
			<Box width='full' minHeight='sh' alignItems='center' backgroundColor='neutral-900' overflow='hidden' position='relative'>
				<Box
					position='absolute'
					zIndex={1}
					style={{
						top: '5%',
						right: '2%',
					}}
					className='Self_Video'
					alignItems='center'
					backgroundColor='#2F343D'
				>
					<video
						id='localVideo'
						autoPlay
						playsInline
						muted
						style={{
							width: '100%',
							transform: 'scaleX(-1)',
							display: isCameraOn ? 'block' : 'none',
						}}
					></video>
					<UserAvatar
						style={{
							display: isCameraOn ? 'none' : 'block',
							margin: 'auto',
						}}
						username={localAvatar}
						className='rcx-message__avatar'
						size={isLocalMobileDevice || callInIframe ? 'x32' : 'x48'}
					/>
				</Box>
				<ButtonGroup
					position='absolute'
					zIndex={1}
					style={{
						bottom: '5%',
					}}
				>
					<Button
						id='mic'
						square
						data-title={isMicOn ? t('Mute_microphone') : t('Unmute_microphone')}
						onClick={(): any => toggleButton('mic')}
						className={isMicOn ? 'On' : 'Off'}
						size={Number(buttonSize)}
					>
						{isMicOn ? <Icon name='mic' size={iconSize} /> : <Icon name='mic-off' size={iconSize} />}
					</Button>
					<Button
						id='camera'
						square
						data-title={isCameraOn ? t('Turn_off_video') : t('Turn_on_video')}
						onClick={(): void => toggleButton('camera')}
						className={isCameraOn ? 'On' : 'Off'}
						size={parseInt(buttonSize)}
					>
						{isCameraOn ? <Icon name='video' size={iconSize} /> : <Icon name='video-off' size={iconSize} />}
					</Button>
					{layout === 'embedded' && (
						<Button
							square
							backgroundColor='#2F343D'
							borderColor='#2F343D'
							data-title={t('Expand_view')}
							onClick={(): void => (parent as any)?.expandCall()}
							size={parseInt(buttonSize)}
						>
							<Icon name='arrow-expand' size={iconSize} color='white' />
						</Button>
					)}
					<Button square primary danger data-title={t('End_call')} onClick={closeWindow} size={parseInt(buttonSize)}>
						<Icon name='phone-off' size={iconSize} color='white' />
					</Button>
				</ButtonGroup>
				<video
					id='remoteVideo'
					autoPlay
					playsInline
					style={{
						width: isRemoteMobileDevice ? '45%' : '100%',
						transform: 'scaleX(-1)',
						display: isRemoteCameraOn ? 'block' : 'none',
					}}
				></video>
				<Box
					position='absolute'
					zIndex={1}
					display={isRemoteCameraOn ? 'none' : 'flex'}
					justifyContent='center'
					flexDirection='column'
					alignItems='center'
					style={{
						top: isRemoteMobileDevice || isLocalMobileDevice ? '10%' : '30%',
					}}
				>
					<UserAvatar
						style={{
							display: 'block',
							margin: 'auto',
						}}
						username={remoteAvatar}
						className='rcx-message__avatar'
						size={!callInIframe ? 'x124' : avatarSize}
					/>
					<Box color='white' fontSize={callInIframe ? 12 : 18} textAlign='center' margin={3}>
						<OngoingCallDuration counter={getCallDuration(callStartTime)} />
					</Box>
					<Box
						style={{
							color: 'white',
							fontSize: callInIframe ? 12 : 22,
							margin: callInIframe ? 5 : 9,
							...(callInIframe && { marginTop: 0 }),
						}}
					>
						{remoteAvatar}
					</Box>
				</Box>
			</Box>
		</Flex.Container>
	);

	return (
		<>
			{status === 'ringing' && (
				<Flex.Container direction='column' justifyContent='center'>
					<Box width='full' minHeight='sh' alignItems='center' backgroundColor='neutral-900' overflow='hidden' position='relative'>
						<Box
							position='absolute'
							zIndex={1}
							style={{
								top: '5%',
								right: '2%',
							}}
							className='Self_Video'
							backgroundColor='#2F343D'
							alignItems='center'
						>
							<UserAvatar
								style={{
									display: 'block',
									margin: 'auto',
								}}
								username={agentName}
								className='rcx-message__avatar'
								size={isLocalMobileDevice ? 'x32' : 'x48'}
							/>
						</Box>
						<Box
							position='absolute'
							zIndex={1}
							style={{
								top: '20%',
								display: 'flex',
								justifyContent: 'center',
								flexDirection: 'column',
							}}
							alignItems='center'
						>
							<UserAvatar
								style={{
									display: 'block',
									margin: 'auto',
								}}
								username={visitorName}
								className='rcx-message__avatar'
								size='x124'
							/>
							<Box color='white' fontSize={16} margin={15}>
								{'Calling...'}
							</Box>
							<Box
								style={{
									color: 'white',
									fontSize: isLocalMobileDevice ? 15 : 22,
								}}
							>
								{visitorName}
							</Box>
						</Box>
					</Box>
				</Flex.Container>
			)}
			{status === 'declined' && (
				<Box minHeight='90%' display='flex' justifyContent='center' alignItems='center' color='white' fontSize='s1'>
					{t('Call_declined')}
				</Box>
			)}
			{status === 'inProgress' && (
				<Flex.Container direction='column' justifyContent='center'>
					{visitorToken ? showCallPage(visitorName, agentName) : showCallPage(agentName, visitorName)}
				</Flex.Container>
			)}
		</>
	);
};

export default CallPage;
