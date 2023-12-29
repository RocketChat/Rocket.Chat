import { Box, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import { ISubscription } from '@rocket.chat/core-typings';

const RoomListItem = ({ sub, setRoomId, roomId }: { sub: ISubscription; roomId: string; setRoomId: (id: string) => void }) => (
	<Box
		is='li'
		backgroundColor={roomId === sub.rid ? 'surface-hover' : 'none'}
		key={sub._id}
		p={16}
		cursor='pointer'
		onClick={() => setRoomId(sub.rid)}
		style={{ cursor: 'pointer' }}
	>
		{sub.t === 'p' ? <Icon name='hashtag-lock' /> : <Icon name='hashtag' />} {sub.fname || sub.name}
	</Box>
);

export default RoomListItem;
