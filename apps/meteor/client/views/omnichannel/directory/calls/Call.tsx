import type { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React, { useEffect, Suspense } from 'react';

import { openRoom } from '../../../../../app/ui-utils/client/lib/openRoom';
import { Room, RoomProvider, RoomSkeleton } from '../../../room';

type CallProps = { rid: IRoom['_id'] };

const Call = ({ rid }: CallProps): ReactElement => {
	useEffect(() => {
		openRoom('v', rid, false);
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
export default Call;
