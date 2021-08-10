import { Button, Box, Icon } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';
import React, { useEffect, useState, useCallback } from 'react';

import { APIClient } from '../../../app/utils/client';
import UserAvatar from '../../components/avatar/UserAvatar';
import { useRouteParameter, useQueryStringParameter } from '../../contexts/RouterContext';
import NotFoundPage from '../notFound/NotFoundPage';
import PageLoading from '../root/PageLoading';
import CallPage from './CallPage';

function MeetPage() {
	const [isRoomMember, setIsRoomMember] = useState(false);
	const [status, setStatus] = useState(null);
	const [visitorId, setVisitorId] = useState(null);
	const [visitorName, setVisitorName] = useState('');
	const [agentName, setAgentName] = useState('');
	const roomId = useRouteParameter('rid');
	const visitorToken = useQueryStringParameter('token');

	const setupCallForVisitor = useCallback(async () => {
		const room = await APIClient.v1.get(`/livechat/room?token=${visitorToken}&rid=${roomId}`);
		if (room?.room?.v?.token === visitorToken) {
			setVisitorId(room.room.v._id);
			setStatus(room?.room?.callStatus || 'ended');
			return setIsRoomMember(true);
		}
	}, [visitorToken, roomId]);

	const setupCallForAgent = useCallback(async () => {
		const room = await APIClient.v1.get(`/rooms.info?roomId=${roomId}`);
		console.log('test', room);
		setVisitorName(room.room.fname);
		setAgentName(room.room.responseBy.username);
		if (room?.room?.servedBy?._id === Meteor.userId()) {
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
			<div style={{ marginTop: 150, padding: 20 }}>
				<Box display='flex' align='center' justifyContent='center'>
					<UserAvatar username={visitorName} className='rcx-message__avatar' size='x200' />
				</Box>
				<p style={{ color: 'white', fontSize: 15, textAlign: 'center', margin: 15 }}>
					{'Call Ended!'}
				</p>
				<p style={{ color: 'white', fontSize: 35, textAlign: 'center', margin: 15 }}>
					{visitorName}
				</p>
				<Box display='flex' align='center' justifyContent='center' margin='x124'>
					<Button title='Close Window' onClick={closeCallTab}>
						<Icon name='cross' size='x16' />
					</Button>
				</Box>
			</div>
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
		></CallPage>
	);
}

export default MeetPage;
