import type { RouteName } from '@rocket.chat/ui-contexts';
import { useRouter, useUser, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import PageLoading from './PageLoading';

const IndexRoute = () => {
	const router = useRouter();
	const uid = useUserId();
	const user = useUser();

	useEffect(() => {
		if (!uid) {
			router.navigate('/home');
			return;
		}

		const computation = Tracker.autorun((c) => {
			setTimeout(async () => {
				if (user?.defaultRoom) {
					const room = user.defaultRoom.split('/') as [routeName: RouteName, routeParam: string];
					router.navigate({
						name: room[0],
						params: { name: room[1] },
						search: router.getSearchParameters(),
					});
				} else {
					router.navigate('/home');
				}
			}, 0);
			c.stop();
		});

		return () => {
			computation.stop();
		};
	}, [router, uid, user?.defaultRoom]);

	return <PageLoading />;
};

export default IndexRoute;
