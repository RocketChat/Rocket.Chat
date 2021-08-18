import { Box, Flex, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import React, { useEffect, useState } from 'react';

import { Notifications } from '../../../app/notifications/client';
import { WebRTC } from '../../../app/webrtc/client';
import { WEB_RTC_EVENTS } from '../../../app/webrtc/index';
import UserAvatar from '../../components/avatar/UserAvatar';
import { useTranslation } from '../../contexts/TranslationContext';
import './CallPage.css';
import { OngoingCallDuration } from './OngoingCallDuration';

function CallPage({
	roomId,
	visitorToken,
	visitorId,
	status,
	setStatus,
	layout,
	visitorName,
	agentName,
}) {
	const [isAgentActive, setIsAgentActive] = useState(false);
	const [isMicOn, setIsMicOn] = useState(false);
	const [isCameraOn, setIsCameraOn] = useState(false);
	const [isRemoteMobileDevice, setIsRemoteMobileDevice] = useState(false);
	const [callInIframe, setCallInIframe] = useState(false);
	const [isRemoteCameraOn, setIsRemoteCameraOn] = useState(false);
	const [isLocalMobileDevice, setIsLocalMobileDevice] = useState(false);

	const t = useTranslation();
	useEffect(() => {
		if (visitorToken) {
			const webrtcInstance = WebRTC.getInstanceByRoomId(roomId, visitorId);
			const isMobileDevice = () => {
				if (window.innerWidth < 450 && window.innerHeight < 620) {
					setCallInIframe(true);
				}
				if (window.innerWidth <= 450 && window.innerHeight >= 620) {
					setIsLocalMobileDevice(true);
					webrtcInstance.media = {
						audio: true,
						video: {
							width: { ideal: 440 },
							height: { ideal: 680 },
						},
					};
					return true;
				}
				return false;
			};
			Notifications.onUser(
				WEB_RTC_EVENTS.WEB_RTC,
				(type, data) => {
					if (data.room == null) {
						return;
					}
					webrtcInstance.onUserStream(type, data);
				},
				visitorId,
			);
			Notifications.onRoom(roomId, 'webrtc', (type, data) => {
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
			Notifications.onRoom(roomId, 'webrtc', (type, data) => {
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
	}, [isAgentActive, status, setStatus, visitorId, roomId, visitorToken]);

	const toggleButton = (control) => {
		if (control === 'mic') {
			WebRTC.getInstanceByRoomId(roomId, visitorToken).toggleAudio();
			return setIsMicOn(!isMicOn);
		}
		WebRTC.getInstanceByRoomId(roomId, visitorToken).toggleVideo();
		setIsCameraOn(!isCameraOn);
		Notifications.notifyRoom(roomId, 'webrtc', 'cameraStatus', { isCameraOn: !isCameraOn });
	};

	const closeWindow = () => {
		if (layout === 'embedded') {
			return parent.handleIframeClose();
		}
		return window.close();
	};

	let iconSize = 'x21';
	let buttonSize = 'x40';
	if (layout === 'embedded') {
		iconSize = 'x19';
		buttonSize = 'x35';
	}

	const showAvatar = (localAvatar, remoteAvatar) => (
		<Flex.Container direction='column' justifyContent='center'>
			<Box
				width='full'
				minHeight='sh'
				alignItems='center'
				backgroundColor='neutral-900'
				overflow='hidden'
				position='relative'
			>
				<Box
					position='absolute'
					zIndex='1'
					style={{
						top: callInIframe ? '2%' : '5%',
						right: '2%',
					}}
					className='Self_Video'
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
						id='localAvatar'
						style={{
							width: callInIframe ? '30%' : '100%',
							height: callInIframe ? '20%' : '60%',
							padding: callInIframe ? '0' : '20% 20% 20% 35%',
							margin: callInIframe ? '10% 10% 10% 30%' : '0',
							display: isCameraOn ? 'none' : 'block',
						}}
						username={localAvatar}
						className='rcx-message__avatar'
						size={isRemoteMobileDevice || callInIframe ? 'x32' : 'x48'}
					/>
				</Box>
				<ButtonGroup
					position='absolute'
					zIndex='1'
					style={{
						bottom: '5%',
					}}
				>
					<Button
						id='mic'
						square
						data-title={isMicOn ? t('Mute_microphone') : t('Unmute_microphone')}
						onClick={() => toggleButton('mic')}
						className={isMicOn ? 'On' : 'Off'}
						size={buttonSize}
					>
						{isMicOn ? (
							<Icon name='mic' size={iconSize} />
						) : (
							<Icon name='mic-off' size={iconSize} />
						)}
					</Button>
					<Button
						id='camera'
						square
						data-title={isCameraOn ? t('Turn_off_video') : t('Turn_on_video')}
						onClick={() => toggleButton('camera')}
						className={isCameraOn ? 'On' : 'Off'}
						size={buttonSize}
					>
						{isCameraOn ? (
							<Icon name='video' size={iconSize} />
						) : (
							<Icon name='video-off' size={iconSize} />
						)}
					</Button>
					{layout === 'embedded' && (
						<Button
							square
							backgroundColor='#2F343D'
							borderColor='#2F343D'
							data-title={t('Expand_view')}
							onClick={() => parent.expandCall()}
							size={buttonSize}
						>
							<Icon name='arrow-expand' size={iconSize} color='white' />
						</Button>
					)}
					<Button
						square
						primary
						danger
						data-title={t('End_call')}
						onClick={closeWindow}
						size={buttonSize}
					>
						<Icon name='phone-off' size={iconSize} color='white' />
					</Button>
				</ButtonGroup>
				<video
					id='remoteVideo'
					autoPlay
					playsInline
					style={{
						width: isLocalMobileDevice ? '45%' : '100%',
						transform: 'scaleX(-1)',
						display: isRemoteCameraOn ? 'block' : 'none',
					}}
				></video>
				<Box
					className='remoteAvatar'
					position='absolute'
					zIndex='1'
					style={{
						top: isLocalMobileDevice ? '30%' : '20%',
						right: isLocalMobileDevice ? '35%' : '45%',
						display: isRemoteCameraOn ? 'none' : 'block',
					}}
				>
					<UserAvatar
						username={remoteAvatar}
						className='rcx-message__avatar'
						size={isLocalMobileDevice || callInIframe ? 'x32' : 'x124'}
					/>
					{!callInIframe ? (
						<p style={{ color: 'white', fontSize: 12, textAlign: 'center', margin: 15 }}>
							<OngoingCallDuration />
						</p>
					) : null}
					<p
						style={{
							color: 'white',
							fontSize: isLocalMobileDevice || callInIframe ? 15 : 35,
							textAlign: 'center',
							marginLeft: isLocalMobileDevice || callInIframe ? '-15%' : '0',
						}}
					>
						{remoteAvatar}
					</p>
				</Box>
			</Box>
		</Flex.Container>
	);

	switch (status) {
		case 'ringing':
			return (
				<Flex.Container direction='column' justifyContent='center'>
					<Box
						width='full'
						minHeight='sh'
						alignItems='center'
						backgroundColor='neutral-900'
						overflow='hidden'
						position='relative'
					>
						<Box
							position='absolute'
							zIndex='1'
							style={{
								top: '5%',
								right: '2%',
							}}
							className='Self_Video'
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
									width: '100%',
									height: '130px',
									paddingTop: '20%',
									paddingLeft: '35%',
									paddingRight: '20%',
									display: isCameraOn ? 'none' : 'block',
								}}
								username={agentName}
								className='rcx-message__avatar'
								size='x48'
							/>
						</Box>
						<video
							id='remoteVideo'
							autoPlay
							playsInline
							style={{
								width: isRemoteMobileDevice ? '45%' : '100%',
								transform: 'scaleX(-1)',
								display: 'block',
							}}
						></video>
						<Box
							position='absolute'
							zIndex='1'
							style={{ top: '20%', right: '45%', display: 'block' }}
						>
							<UserAvatar username={visitorName} className='rcx-message__avatar' size='x124' />
							<p style={{ color: 'white', fontSize: 15, textAlign: 'center', margin: 15 }}>
								{'Calling....'}
							</p>
							<p style={{ color: 'white', fontSize: 35, textAlign: 'center', margin: 15 }}>
								{visitorName}
							</p>
						</Box>
					</Box>
				</Flex.Container>
			);

		case 'declined':
			return (
				<Box
					minHeight='90%'
					display='flex'
					justifyContent='center'
					alignItems='center'
					color='white'
					fontSize='s1'
				>
					{t('Call_declined')}
				</Box>
			);
		case 'inProgress':
			return (
				<Flex.Container direction='column' justifyContent='center'>
					{visitorToken ? showAvatar(visitorName, agentName) : showAvatar(agentName, visitorName)}
				</Flex.Container>
			);
	}
}

export default CallPage;
