import type { RoomType } from '@rocket.chat/core-typings';
import { useEmbeddedLayout } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useLayoutEffect, useState } from 'react';

import RoomOpener from './RoomOpener';
import RoomOpenerEmbedded from './RoomOpenerEmbedded';

type RoomRouteProps = {
	extractOpenRoomParams: (routeParams: Record<string, string | null | undefined>) => {
		type: RoomType;
		reference: string;
	};
};

const RoomRoute = ({ extractOpenRoomParams }: RoomRouteProps) => {
	const router = useRouter();
	const [params, setParams] = useState(() => extractOpenRoomParams(router.getRouteParameters()));

	const isEmbeddedLayout = useEmbeddedLayout();

	useLayoutEffect(
		() =>
			router.subscribeToRouteChange(() => {
				setParams(extractOpenRoomParams(router.getRouteParameters()));
			}),
		[extractOpenRoomParams, router],
	);

	if (isEmbeddedLayout) {
		return <RoomOpenerEmbedded {...params} />;
	}

	return <RoomOpener {...params} />;
};

export default RoomRoute;
