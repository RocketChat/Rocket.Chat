import { useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export const useIsOverMacLimit = (): boolean => {
	const queryClient = useQueryClient();
	const notifyLogged = useStream('notify-logged');
	const getMacLimit = useEndpoint('GET', '/v1/omnichannel/mac/check');
	const { data: isOverMacLimit } = useQuery(['/v1/omnichannel/mac/check'], () => getMacLimit());

	useEffect(() => {
		return notifyLogged(`mac.limit`, ({ limitReached }) => {
			limitReached && queryClient.invalidateQueries(['/v1/omnichannel/mac/check']);
		});
	}, [notifyLogged, queryClient]);

	return !!isOverMacLimit;
};
