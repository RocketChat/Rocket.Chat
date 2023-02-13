import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';

export const useGoToThread = ({ replace = false }: { replace?: boolean } = {}): ((params: {
	rid: IRoom['_id'];
	tmid: IMessage['_id'];
	jump?: IMessage['_id'];
}) => void) => {
	const [routeName, params, queryParams] = useCurrentRoute();

	if (!routeName) {
		throw new Error('Route name is not defined');
	}

	const roomRoute = useRoute(routeName);
	const go = replace ? roomRoute.replace : roomRoute.push;

	// TODO: remove params recycling
	return useMutableCallback(({ rid, tmid, jump }) => {
		go({ rid, ...params, tab: 'thread', context: tmid }, { ...queryParams, ...(jump && { jump }) });
	});
};
