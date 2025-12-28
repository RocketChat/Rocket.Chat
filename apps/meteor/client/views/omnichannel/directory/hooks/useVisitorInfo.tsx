import type { ILivechatVisitor } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useVisitorInfo = (visitorId: ILivechatVisitor['_id'], { enabled = true, gcTime = 0 } = {}) => {
	const getVisitorInfo = useEndpoint('GET', '/v1/livechat/visitors.info');
	const { data, ...props } = useQuery({
		queryKey: ['/v1/livechat/visitors.info', visitorId],
		queryFn: async (): Promise<ILivechatVisitor> => {
			const { visitor } = await getVisitorInfo({ visitorId });
			return {
				...visitor,
				_id: visitor._id as ILivechatVisitor['_id'],
				ts: new Date(visitor.ts),
				lastChat: visitor.lastChat
					? {
							...visitor.lastChat,
							ts: new Date(visitor.lastChat.ts),
						}
					: undefined,
				lastAgent: visitor.lastAgent
					? {
							...visitor.lastAgent,
							ts: new Date(visitor.lastAgent.ts),
						}
					: undefined,
				_updatedAt: new Date(visitor._updatedAt),
			};
		},
		enabled,
		gcTime,
	});
	return { data, ...props };
};
