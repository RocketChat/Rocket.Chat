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
	const t = useTranslation();
	useEffect(() => {
		if (visitorToken) {
			const webrtcInstance = WebRTC.getInstanceByRoomId(roomId, visitorId);
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
				}
			});
			Notifications.notifyRoom(roomId, 'webrtc', 'callStatus', { callStatus: 'inProgress' });
		} else if (!isAgentActive) {
			const webrtcInstance = WebRTC.getInstanceByRoomId(roomId);
			if (status === 'inProgress') {
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

	switch (status) {
		case 'ringing':
			return (
				<Flex.Container direction='column' justifyContent='center'>
					<Box
						width='full'
						minHeight='sh'
						textAlign='center'
						backgroundColor='neutral-900'
						overflow='hidden'
						position='relative'
						backgroundColor='#181B20'
					>
						<Box
							position='absolute'
							zIndex='1'
							style={{
								top: '5%',
								right: '2%',
							}}
							w='x200'
							backgroundColor='#2F343D'
						>
							<UserAvatar
								style={{
									width: '100%',
									height: '130px',
									paddingTop: '20%',
									paddingLeft: '35%',
									paddingRight: '20%',
								}}
								username={agentName}
								className='rcx-message__avatar'
								size='x48'
							/>
						</Box>
						<Box position='absolute' zIndex='1' style={{ top: '20%', right: '45%' }}>
							<UserAvatar username={visitorName} className='rcx-message__avatar' size='x124' />
							<p style={{ color: 'white', fontSize: 15, textAlign: 'center', margin: 15 }}>
								{'Calling...'}
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
							w='x200'
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
								alignItems='center'
								username={agentName}
								className='rcx-message__avatar'
								size='x48'
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
							>
								{isMicOn ? <Icon name='mic' size='x21' /> : <Icon name='mic-off' size='x21' />}
							</Button>
							<Button
								id='camera'
								square
								data-title={isCameraOn ? t('Turn_off_video') : t('Turn_on_video')}
								onClick={() => toggleButton('camera')}
								className={isCameraOn ? 'On' : 'Off'}
							>
								{isCameraOn ? (
									<Icon name='video' size='x21' />
								) : (
									<Icon name='video-off' size='x21' />
								)}
							</Button>
							{layout === 'embedded' && (
								<Button
									square
									backgroundColor='#2F343D'
									borderColor='#2F343D'
									data-title={t('Expand_view')}
									onClick={() => parent.expandCall()}
								>
									<Icon name='arrow-expand' size='x21' color='white' />
								</Button>
							)}
							<Button square primary danger data-title={t('End_call')} onClick={closeWindow}>
								<Icon name='phone-off' size='x21' color='white' />
							</Button>
						</ButtonGroup>
						<OngoingCallDuration />
						<video
							id='remoteVideo'
							autoPlay
							playsInline
							style={{
								width: '100%',
								transform: 'scaleX(-1)',
							}}
						></video>
					</Box>
				</Flex.Container>
			);
	}
}

export default CallPage;
