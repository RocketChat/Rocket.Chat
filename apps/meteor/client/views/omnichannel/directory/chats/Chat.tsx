import type { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import React, { useEffect, Suspense, ReactElement } from 'react';

import { openRoom } from '../../../../../app/ui-utils/client/lib/openRoom';
import { Room, RoomProvider, RoomSkeleton } from '../../../room';

type ChatProps = { rid: IRoom['_id'] };

const Chat = ({ rid }: ChatProps): ReactElement => {
	useEffect(() => {
		openRoom('l', rid, false);
	}, [rid]);

	return (
		<Box position='absolute' backgroundColor='surface' width='full' height='full'>
			<Suspense fallback={<RoomSkeleton />}>
				<RoomProvider rid={rid}>
					<Room />
				</RoomProvider>
			</Suspense>
		</Box>
	);
};
export default Chat;
