import { Box, Flex, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation, useStream } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import { useEffect, useState } from 'react';

import OngoingCallDuration from './OngoingCallDuration';
import './styles.css';

type CallPageProps = {
	roomId?: string;
	visitorToken: any;
	visitorId: string | null;
	status: any;
	setStatus: any;
	isLayoutEmbedded: boolean;
	visitorName: any;
	agentName: any;
	callStartTime: any;
};

const CallPage = ({
	roomId,
	visitorToken,
	visitorId,
	status,
	setStatus,
	isLayoutEmbedded,
	visitorName,
	agentName,
	callStartTime,
}: CallPageProps) => {
	if (!roomId) {
		throw new Error('Call Page - no room id');
	}
	const [isAgentActive, setIsAgentActive] = useState(false);
	const [isMicOn, setIsMicOn] = useState(false);
	const [isCameraOn, setIsCameraOn] = useState(false);
	const [isRemoteMobileDevice] = useState(false);
	const [callInIframe] = useState(false);
	const [isRemoteCameraOn] = useState(false);
	const [isLocalMobileDevice] = useState(false);

	let iconSize = 'x21';
	let buttonSize = 'x40';
	const avatarSize = 'x48';
	if (isLayoutEmbedded) {
		iconSize = 'x19';
		buttonSize = 'x35';
	}

	const subscribeNotifyUser = useStream('notify-user');
	const subscribeNotifyRoom = useStream('notify-room');
	const t = useTranslation();
	useEffect(() => {
		if (visitorToken) {
			if (!visitorId) {
				throw new Error('Call Page - no visitor id');
			}
		}

		if (!isAgentActive) {
			setIsAgentActive(true);
		}
	}, [isAgentActive, status, setStatus, visitorId, roomId, visitorToken, isLayoutEmbedded, subscribeNotifyUser, subscribeNotifyRoom]);

	const toggleButton = (control: any): any => {
		if (control === 'mic') {
			return setIsMicOn(!isMicOn);
		}
		setIsCameraOn(!isCameraOn);
	};

	const closeWindow = (): void => {
		if (isLayoutEmbedded) {
			return (parent as any)?.handleIframeClose();
		}
		return window.close();
	};

	const getCallDuration = (callStartTime: any): any => moment.duration(moment(new Date()).diff(moment(callStartTime))).asSeconds();

	const showCallPage = (localAvatar: any, remoteAvatar: any): any => (
		<Flex.Container direction='column' justifyContent='center'>
			<Box width='full' minHeight='sh' alignItems='center' backgroundColor='dark' overflow='hidden' position='relative'>
				<Box
					position='absolute'
					zIndex={1}
					style={{
						top: '5%',
						right: '2%',
					}}
					className='meet__video--self'
					alignItems='center'
					backgroundColor='dark'
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
					<Box
						style={{
							display: isCameraOn ? 'none' : 'block',
							margin: 'auto',
						}}
					>
						<UserAvatar username={localAvatar} size={isLocalMobileDevice || callInIframe ? 'x32' : 'x48'} />
					</Box>
				</Box>
				<Box
					position='absolute'
					zIndex={1}
					style={{
						bottom: '5%',
					}}
				>
					<ButtonGroup>
						<Button
							id='mic'
							square
							title={isMicOn ? t('Mute_microphone') : t('Unmute_microphone')}
							onClick={(): any => toggleButton('mic')}
							className={isMicOn ? 'meet__button--on' : 'meet__button--off'}
							size={Number(buttonSize)}
						>
							{isMicOn ? <Icon name='mic' size={iconSize} /> : <Icon name='mic-off' size={iconSize} />}
						</Button>
						<Button
							id='camera'
							square
							title={isCameraOn ? t('Turn_off_video') : t('Turn_on_video')}
							onClick={(): void => toggleButton('camera')}
							className={isCameraOn ? 'meet__button--on' : 'meet__button--off'}
							size={parseInt(buttonSize)}
						>
							{isCameraOn ? <Icon name='video' size={iconSize} /> : <Icon name='video-off' size={iconSize} />}
						</Button>
						{isLayoutEmbedded && (
							<Button
								square
								backgroundColor='dark'
								borderColor='stroke-extra-dark'
								data-title={t('Expand_view')}
								onClick={(): void => (parent as any)?.expandCall()}
								size={parseInt(buttonSize)}
							>
								<Icon name='arrow-expand' size={iconSize} color='white' />
							</Button>
						)}
						<Button square danger title={t('End_call')} onClick={closeWindow} size={parseInt(buttonSize)}>
							<Icon name='phone-off' size={iconSize} color='white' />
						</Button>
					</ButtonGroup>
				</Box>
				<video
					id='remoteVideo'
					autoPlay
					playsInline
					style={{
						width: isRemoteMobileDevice ? '45%' : '100%',
						transform: 'scaleX(-1)',
						display: isRemoteCameraOn ? 'block' : 'none',
					}}
				>
					<track kind='captions' />
				</video>
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
					<Box
						style={{
							display: 'block',
							margin: 'auto',
						}}
					>
						<UserAvatar username={remoteAvatar} size={!callInIframe ? 'x124' : avatarSize} />
					</Box>

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
					<Box width='full' minHeight='sh' alignItems='center' backgroundColor='dark' overflow='hidden' position='relative'>
						<Box
							position='absolute'
							zIndex={1}
							style={{
								top: '5%',
								right: '2%',
							}}
							className='meet__video--self'
							backgroundColor='dark'
							alignItems='center'
						>
							<Box
								style={{
									display: 'block',
									margin: 'auto',
								}}
							>
								<UserAvatar username={agentName} size={isLocalMobileDevice ? 'x32' : 'x48'} />
							</Box>
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
							<Box
								style={{
									display: 'block',
									margin: 'auto',
								}}
							>
								<UserAvatar username={visitorName} size='x124' />
							</Box>
							<Box color='white' fontSize={16} margin={15}>
								Calling...
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
