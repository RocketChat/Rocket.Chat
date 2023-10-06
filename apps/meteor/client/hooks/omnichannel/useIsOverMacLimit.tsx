import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useIsOverMacLimit = (): boolean => {
	const getMacLimit = useEndpoint('GET', '/v1/omnichannel/mac/check');
	const { data: { onLimit = false } = {} } = useQuery(['/v1/omnichannel/mac/check'], () => getMacLimit());

	return !onLimit;
};
