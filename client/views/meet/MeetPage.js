import { Meteor } from 'meteor/meteor';
import React, { useEffect, useState, useCallback } from 'react';

import { APIClient } from '../../../app/utils/client';
import { useRouteParameter, useQueryStringParameter } from '../../contexts/RouterContext';
import NotFoundPage from '../notFound/NotFoundPage';
import PageLoading from '../root/PageLoading';
import CallPage from './CallPage';

function MeetPage() {
	const [isRoomMember, setIsRoomMember] = useState(false);
	const [status, setStatus] = useState(null);
	const roomId = useRouteParameter('rid');
	const visitorToken = useQueryStringParameter('token');
	const visitorId = useQueryStringParameter('id');

	const setupCallForVisitor = useCallback(async () => {
		const room = await APIClient.v1.get(`/livechat/room?token=${visitorToken}&rid=${roomId}`);
		if (room?.room?.v?.token === visitorToken) {
			setStatus(room?.room?.callStatus || 'ended');
			return setIsRoomMember(true);
		}
	}, [visitorToken, roomId]);

	const setupCallForAgent = useCallback(async () => {
		const room = await APIClient.v1.get(`/rooms.info?roomId=${roomId}`);
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
	if (status === 'ended') {
		return <h1 style={{ color: 'white', textAlign: 'center', marginTop: 250 }}>Ended!</h1>;
	}
	return (
		<CallPage
			roomId={roomId}
			status={status}
			visitorToken={visitorToken}
			visitorId={visitorId}
			setStatus={setStatus}
		></CallPage>
	);
}

export default MeetPage;
