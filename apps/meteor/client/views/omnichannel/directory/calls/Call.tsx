import type { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import React, { useEffect, FC } from 'react';

import { openRoom } from '../../../../../app/ui-utils/client/lib/openRoom';
import RoomWithData from '../../../room/Room';

const Chat: FC<{ rid: IRoom['_id'] }> = ({ rid }) => {
	useEffect(() => {
		openRoom('v', rid, false);
	}, [rid]);

	return (
		<Box position='absolute' backgroundColor='surface' width='full' height='full'>
			<RoomWithData />
		</Box>
	);
};
export default Chat;
