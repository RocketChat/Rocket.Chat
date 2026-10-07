import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouter } from '@rocket.chat/ui-contexts';

import { useOpenThreadOverride } from '../contexts/OpenThreadContext';

export const useGoToThread = ({ replace = false }: { replace?: boolean } = {}) => {
	const router = useRouter();
	const openThread = useOpenThreadOverride();

	// TODO: remove params recycling
	return useStableCallback(({ rid, tmid, msg }: { rid: IRoom['_id']; tmid: IMessage['_id']; msg?: IMessage['_id'] }) => {
		if (openThread) {
			openThread(tmid, msg);
			return;
		}

		const routeName = router.getRouteName();

		if (!routeName) {
			throw new Error('Route name is not defined');
		}

		router.navigate(
			{
				name: routeName,
				params: { rid, ...router.getRouteParameters(), tab: 'thread', context: tmid },
				search: { ...router.getSearchParameters(), ...(msg && { msg }) },
			},
			{ replace },
		);
	});
};
