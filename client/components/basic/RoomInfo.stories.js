import React from 'react';

import { UserInfo } from './UserInfo';
import { RoomInfo } from './RoomInfo';
import VerticalBar from './VerticalBar';

export default {
	title: 'components/RoomInfo',
	component: UserInfo,
};

const room = {
	name: 'rocketchat-frontend-team',
	description: 'https://jitsi.rocket.chat/testRoom',
	announcement: 'https://jitsi.rocket.chat/testRoom',
	topic: 'https://jitsi.rocket.chat/testRoom',
};

export const Default = () => <VerticalBar><RoomInfo roomName={room.name} description={room.description} announcement={room.announcement} topic={room.topic} /></VerticalBar>;
