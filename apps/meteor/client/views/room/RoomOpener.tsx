import type { RoomType } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React, { lazy, Suspense } from 'react';

import RoomSkeleton from './RoomSkeleton';
import { useOpenRoom } from './hooks/useOpenRoom';

const RoomProvider = lazy(() => import('./providers/RoomProvider'));
const RoomNotFound = lazy(() => import('./RoomNotFound'));
const Room = lazy(() => import('./Room/Room'));

type RoomOpenerProps = {
	type: RoomType;
	reference: string;
};

const RoomOpener = ({ type, reference }: RoomOpenerProps): ReactElement => {
	const { data, isSuccess, isError, isLoading } = useOpenRoom({ type, reference });

	return (
		<Suspense fallback={<RoomSkeleton />}>
			{isLoading && <RoomSkeleton />}
			{isSuccess && ('rid' in data ? <RoomProvider rid={data.rid}>{<Room />}</RoomProvider> : <RoomSkeleton />)}
			{isError && <RoomNotFound />}
		</Suspense>
	);
};

export default RoomOpener;
