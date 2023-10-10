import { useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useIsOverMacLimit = (): boolean => {
	const getMacLimit = useEndpoint('GET', '/v1/omnichannel/mac/check');
	const isLivechatManager = usePermission('view-livechat-manager');
	const { data: { onLimit = true } = {} } = useQuery(['/v1/omnichannel/mac/check'], () => getMacLimit(), { enabled: isLivechatManager });

	return !onLimit;
};
