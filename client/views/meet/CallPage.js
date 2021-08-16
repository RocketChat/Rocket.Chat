import { Box, Flex, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import React, { useEffect, useState } from 'react';

import { Notifications } from '../../../app/notifications/client';
import { WebRTC } from '../../../app/webrtc/client';
import { WEB_RTC_EVENTS } from '../../../app/webrtc/index';
import { useTranslation } from '../../contexts/TranslationContext';
import './CallPage.css';

function CallPage({ roomId, visitorToken, visitorId, status, setStatus, layout }) {
	const [isAgentActive, setIsAgentActive] = useState(false);
	const [isMicOn, setIsMicOn] = useState(false);
	const [isCameraOn, setIsCameraOn] = useState(false);
	const [isRemoteMobileDevice, setIsRemoteMobileDevice] = useState(false);
	const t = useTranslation();
	useEffect(() => {
		if (visitorToken) {
			const webrtcInstance = WebRTC.getInstanceByRoomId(roomId, visitorId);
			const isMobileDevice = () => {
				if (window.innerWidth <= 450 && window.innerHeight >= 620) {
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
	};

	const closeWindow = () => {
		if (layout === 'embedded') {
			return parent.handleIframeClose();
		}
		return window.close();
	};

	const iconSize = layout === 'embedded' ? 'x19' : 'x21';
	const buttonSize = layout === 'embedded' ? 'x35' : 'x40';

	switch (status) {
		case 'ringing':
			// Todo Deepak
			return (
				<h1 style={{ color: 'white', textAlign: 'center', marginTop: 250 }}>
					Waiting for the visitor to join ...
				</h1>
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
						>
							<video
								id='localVideo'
								autoPlay
								playsInline
								muted
								style={{
									width: '100%',
									transform: 'scaleX(-1)',
								}}
							></video>
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
								width: isRemoteMobileDevice ? '45%' : '100%',
								transform: 'scaleX(-1)',
							}}
						></video>
					</Box>
				</Flex.Container>
			);
	}
}

export default CallPage;
