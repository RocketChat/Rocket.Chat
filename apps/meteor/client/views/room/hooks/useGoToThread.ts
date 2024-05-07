import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouter } from '@rocket.chat/ui-contexts';

export const useGoToThread = ({ replace = false }: { replace?: boolean } = {}): ((params: {
	rid: IRoom['_id'];
	tmid: IMessage['_id'];
	msg?: IMessage['_id'];
}) => void) => {
	const router = useRouter();

	// TODO: remove params recycling
	return useMutableCallback(({ rid, tmid, msg }) => {
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
