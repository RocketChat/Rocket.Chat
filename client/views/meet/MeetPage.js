import { Button, Box, Icon, Flex } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';
import React, { useEffect, useState, useCallback } from 'react';

import { APIClient } from '../../../app/utils/client';
import UserAvatar from '../../components/avatar/UserAvatar';
import { useRouteParameter, useQueryStringParameter } from '../../contexts/RouterContext';
import NotFoundPage from '../notFound/NotFoundPage';
import PageLoading from '../root/PageLoading';
import CallPage from './CallPage';
import './CallPage.css';

function MeetPage() {
	const [isRoomMember, setIsRoomMember] = useState(false);
	const [status, setStatus] = useState(null);
	const [visitorId, setVisitorId] = useState(null);
	const roomId = useRouteParameter('rid');
	const visitorToken = useQueryStringParameter('token');
	const layout = useQueryStringParameter('layout');
	const [visitorName, setVisitorName] = useState('');
	const [agentName, setAgentName] = useState('');

	const ismobiledevice = () => {
		if (window.innerWidth <= 450 && window.innerHeight >= 620) {
			return true;
		}
		return false;
	};

	const setupCallForVisitor = useCallback(async () => {
		const room = await APIClient.v1.get(`/livechat/room?token=${visitorToken}&rid=${roomId}`);
		if (room?.room?.v?.token === visitorToken) {
			setVisitorId(room.room.v._id);
			setVisitorName(room.room.fname);
			room?.room?.responseBy?.username
				? setAgentName(room.room.responseBy.username)
				: setAgentName(room.room.servedBy.username);
			setStatus(room?.room?.callStatus || 'ended');
			return setIsRoomMember(true);
		}
	}, [visitorToken, roomId]);

	const setupCallForAgent = useCallback(async () => {
		const room = await APIClient.v1.get(`/rooms.info?roomId=${roomId}`);
		if (room?.room?.servedBy?._id === Meteor.userId()) {
			setVisitorName(room.room.fname);
			room?.room?.responseBy?.username
				? setAgentName(room.room.responseBy.username)
				: setAgentName(room.room.servedBy.username);
			setStatus(room?.room?.callStatus || 'ended');
			return setIsRoomMember(true);
		}
	}, [roomId]);

	useEffect(() => {
		if (visitorToken) {
			return setupCallForVisitor();
		}
		setupCallForAgent();
	}, [setupCallForAgent, setupCallForVisitor, visitorToken]);
	if (status === null) {
		return <PageLoading></PageLoading>;
	}
	if (!isRoomMember) {
		return <NotFoundPage></NotFoundPage>;
	}
	const closeCallTab = () => {
		window.close();
	};
	if (status === 'ended') {
		return (
			<Flex.Container direction='column' justifyContent='center'>
				{visitorToken ? (
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
							<UserAvatar
								id='localAvatar'
								style={{
									width: '100%',
									height: '60%',
									padding: '20% 20% 20% 35%',
									display: 'block',
								}}
								username={visitorName}
								className='rcx-message__avatar'
								size={ismobiledevice() ? 'x32' : 'x48'}
							/>
						</Box>
						<Box
							className='remoteAvatar'
							position='absolute'
							zIndex='1'
							style={{
								top: ismobiledevice() ? '30%' : '20%',
								right: ismobiledevice() ? '35%' : '45%',
								display: 'block',
							}}
						>
							<UserAvatar
								username={agentName}
								className='rcx-message__avatar'
								size={ismobiledevice() ? 'x32' : 'x124'}
							/>
							<p style={{ color: 'white', fontSize: 16, textAlign: 'center', margin: 15 }}>
								{'Call Ended!'}
							</p>
							<p
								style={{
									color: 'white',
									fontSize: ismobiledevice() ? 15 : 35,
									textAlign: 'center',
									marginLeft: ismobiledevice() ? '20%' : '0',
								}}
							>
								{agentName}
							</p>
						</Box>
					</Box>
				) : (
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
							<UserAvatar
								id='localAvatar'
								style={{
									width: '100%',
									height: '60%',
									padding: '20% 20% 20% 35%',
									display: 'block',
								}}
								username={agentName}
								className='rcx-message__avatar'
								size={ismobiledevice() ? 'x32' : 'x48'}
							/>
						</Box>

						<Box
							className='remoteAvatar'
							position='absolute'
							zIndex='1'
							style={{
								top: ismobiledevice() ? '30%' : '20%',
								right: ismobiledevice() ? '35%' : '45%',
								display: 'block',
							}}
						>
							<UserAvatar
								username={visitorName}
								className='rcx-message__avatar'
								size={ismobiledevice() ? 'x32' : 'x124'}
							/>
							<p style={{ color: 'white', fontSize: 16, textAlign: 'center', margin: 15 }}>
								{'Call Ended!'}
							</p>
							<p
								style={{
									color: 'white',
									fontSize: ismobiledevice() ? 15 : 35,
									textAlign: 'center',
									marginLeft: ismobiledevice() ? '20%' : '0',
								}}
							>
								{visitorName}
							</p>
						</Box>
					</Box>
				)}
				<Box position='absolute' zIndex='1' style={{ top: '80%', right: '48%' }}>
					<Button
						title='Close Window'
						onClick={closeCallTab}
						backgroundColor='#2F343D'
						borderColor='#2F343D'
					>
						<Icon name='cross' size='x16' color='white' />
					</Button>
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
			layout={layout}
		></CallPage>
	);
}

export default MeetPage;
