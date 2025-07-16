import { Button, Box, Flex } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useRouteParameter, useSearchParameter } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import CallPage from './CallPage';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { useEmbeddedLayout } from '../../hooks/useEmbeddedLayout';
import NotFoundPage from '../notFound/NotFoundPage';
import PageLoading from '../root/PageLoading';
import './styles.css';

const MeetPage = () => {
	const { t } = useTranslation();
	const [isRoomMember, setIsRoomMember] = useState(false);
	const [status, setStatus] = useState(null);
	const [visitorId, setVisitorId] = useState(null);
	const roomId = useRouteParameter('rid');
	const visitorToken = useSearchParameter('token');
	const isLayoutEmbedded = useEmbeddedLayout();
	const [visitorName, setVisitorName] = useState('');
	const [agentName, setAgentName] = useState('');
	const [callStartTime, setCallStartTime] = useState(undefined);

	const isMobileDevice = (): boolean => window.innerWidth <= 450;
	const closeCallTab = (): void => window.close();

	const setupCallForVisitor = useCallback(async () => {
		if (!visitorToken || !roomId) {
			throw new Error('Missing parameters');
		}

		const room = (await sdk.rest.get('/v1/livechat/room', {
			token: visitorToken,
			rid: roomId,
		})) as any;
		if (room?.room?.v?.token === visitorToken) {
			setVisitorId(room.room.v._id);
			setVisitorName(room.room.fname);
			room?.room?.responseBy?.username ? setAgentName(room.room.responseBy.username) : setAgentName(room.room.servedBy.username);
			setStatus(room?.room?.callStatus || 'ended');
			setCallStartTime(room.room.webRtcCallStartTime);
			return setIsRoomMember(true);
		}
	}, [visitorToken, roomId]);

	const setupCallForAgent = useCallback(async () => {
		if (!roomId) {
			throw new Error('Missing parameters');
		}

		const room = (await sdk.rest.get('/v1/rooms.info', { roomId })) as any;
		if (room?.room?.servedBy?._id === Meteor.userId()) {
			setVisitorName(room.room.fname);
			room?.room?.responseBy?.username ? setAgentName(room.room.responseBy.username) : setAgentName(room.room.servedBy.username);
			setStatus(room?.room?.callStatus || 'ended');
			setCallStartTime(room.room.webRtcCallStartTime);
			return setIsRoomMember(true);
		}
	}, [roomId]);

	useEffect(() => {
		if (visitorToken) {
			setupCallForVisitor();
			return;
		}
		setupCallForAgent();
	}, [setupCallForAgent, setupCallForVisitor, visitorToken]);

	if (status === null) {
		return <PageLoading />;
	}

	if (!isRoomMember) {
		return <NotFoundPage />;
	}

	if (status === 'ended') {
		return (
			<Flex.Container direction='column' justifyContent='center'>
				<Box width='full' minHeight='sh' alignItems='center' backgroundColor='dark' overflow='hidden' position='relative'>
					<Box
						position='absolute'
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
							<UserAvatar username={visitorToken ? visitorName : agentName} size={isMobileDevice() ? 'x32' : 'x48'} />
						</Box>
					</Box>
					<Box
						position='absolute'
						zIndex={1}
						style={{
							top: isMobileDevice() ? '30%' : '20%',
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
							<UserAvatar username={visitorToken ? agentName : visitorName} size='x124' />
						</Box>
						<p style={{ color: 'white', fontSize: 16, margin: 15 }}>Call Ended!</p>
						<p
							style={{
								color: 'white',
								fontSize: isMobileDevice() ? 15 : 22,
							}}
						>
							{visitorToken ? agentName : visitorName}
						</p>
					</Box>
					<Box position='absolute' alignItems='center' style={{ bottom: '20%' }}>
						<Button
							icon='cross'
							square
							title={t('Close_Window')}
							onClick={closeCallTab}
							backgroundColor='dark'
							borderColor='extra-dark'
						></Button>
					</Box>
				</Box>
			</Flex.Container>
		);
	}

	return (
		<CallPage
			roomId={roomId}
			status={status}
			visitorToken={visitorToken}
			visitorId={visitorId}
			setStatus={setStatus}
			visitorName={visitorName}
			agentName={agentName}
			isLayoutEmbedded={isLayoutEmbedded}
			callStartTime={callStartTime}
		/>
	);
};

export default MeetPage;
