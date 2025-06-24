import type { ILivechatPriority, Serialized } from '@rocket.chat/core-typings';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useOmnichannelPriorities } from '@rocket.chat/ui-omnichannel';
import { useQuery } from '@tanstack/react-query';

type ILivechatClientPriority = Serialized<ILivechatPriority> & {
	i18n: TranslationKey;
};

export const usePriorityInfo = (priorityId: string) => {
	const { enabled } = useOmnichannelPriorities();
	const getPriority = useEndpoint('GET', `/v1/livechat/priorities/:priorityId`, { priorityId });
	return useQuery({
		queryKey: ['/v1/livechat/priorities', priorityId],
		queryFn: () => getPriority() as Promise<ILivechatClientPriority>,
		gcTime: 0,
		enabled,
	});
};
