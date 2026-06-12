import type { RoomType } from '@rocket.chat/core-typings';
import { Box, Button } from '@rocket.chat/fuselage';
import { useState } from 'react';

import RoomOpenerEmbedded from '../room/RoomOpenerEmbedded';
import EmbeddedPreload from '../root/MainLayout/EmbeddedPreload';

type ConferenceChatProps = {
	type: RoomType;
	reference: string;
	loading: boolean;
};
const ConferenceChat = ({ type, loading }: ConferenceChatProps) => {
	const [reference, setReference] = useState('general');

	if (loading) {
		return <div>Loading...</div>;
	}

	return (
		<Box position='relative' display='flex' flexDirection='column' flexGrow={1}>
			<div>
				{/* Temporary buttons to test room change */}
				<Button onClick={() => setReference('general')}>general</Button>
				<Button onClick={() => setReference('important')}>important</Button>
			</div>
			<EmbeddedPreload type={type} reference={reference}>
				<RoomOpenerEmbedded type={type} reference={reference} />
			</EmbeddedPreload>
		</Box>
	);
};

export default ConferenceChat;
