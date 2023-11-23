import type { IMessage } from '@rocket.chat/core-typings';

import { router } from '../../providers/RouterProvider';

export const setMessageJumpQueryStringParameter = async (msg: IMessage['_id'] | null) => {
	const { msg: _, ...search } = router.getSearchParameters();

	router.navigate(
		{
			pathname: router.getLocationPathname(),
			search: msg ? { ...search, msg } : search,
		},
		{ replace: true },
	);
};
