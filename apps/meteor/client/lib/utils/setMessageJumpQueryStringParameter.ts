import type { IMessage } from '@rocket.chat/core-typings';
import type { LocationPathname } from '@rocket.chat/ui-contexts';

import { router } from '../../providers/RouterProvider';

export const setMessageJumpQueryStringParameter = async (msg: IMessage['_id'] | null) => {
	const { msg: _, ...search } = router.getSearchParameters();
	const locationPathname = new URL(window.location.href).pathname as LocationPathname;

	router.navigate(
		{
			pathname: locationPathname,
			search: msg ? { ...search, msg } : search,
		},
		{ replace: true },
	);
};
