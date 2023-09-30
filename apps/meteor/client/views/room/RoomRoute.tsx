import type { RoomType } from '@rocket.chat/core-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import React, { useLayoutEffect, useState } from 'react';

import RoomOpener from './RoomOpener';

type RoomRouteProps = {
	extractOpenRoomParams: (routeParams: Record<string, string | null | undefined>) => {
		type: RoomType;
		reference: string;
	};
};

const RoomRoute = ({ extractOpenRoomParams }: RoomRouteProps) => {
	const router = useRouter();
	const [params, setParams] = useState(() => extractOpenRoomParams(router.getRouteParameters()));

	useLayoutEffect(
		() =>
			router.subscribeToRouteChange(() => {
				setParams(extractOpenRoomParams(router.getRouteParameters()));
			}),
		[extractOpenRoomParams, router],
	);

	return <RoomOpener {...params} />;
};

export default RoomRoute;
