import type { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React, { Suspense } from 'react';

import { useOpenRoom } from '../../../../hooks/useOpenRoom';
import { Room, RoomNotFound, RoomProvider, RoomSkeleton } from '../../../room';

type ChatProps = { rid: IRoom['_id'] };

const Chat = ({ rid }: ChatProps): ReactElement => {
	const { data, isSuccess, isError, isLoading } = useOpenRoom({ type: 'l', ref: rid });

	return (
		<Box position='absolute' backgroundColor='surface' width='full' height='full'>
			<Suspense fallback={<RoomSkeleton />}>
				{isLoading && <RoomSkeleton />}
				{isSuccess && ('rid' in data ? <RoomProvider rid={data.rid}>{<Room />}</RoomProvider> : <RoomSkeleton />)}
				{isError && <RoomNotFound />}
			</Suspense>
		</Box>
	);
};
export default Chat;
