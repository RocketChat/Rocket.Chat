import type { ILivechatPriority, Serialized } from '@rocket.chat/core-typings';
import { OmnichannelContext } from '@rocket.chat/ui-omnichannel';
import type { ReactNode } from 'react';

export const MockedOmnichannelContext = ({
	livechatPriorities = [],
	children,
}: {
	livechatPriorities: Serialized<ILivechatPriority>[];
	children: ReactNode;
}) => {
	return (
		<OmnichannelContext.Provider
			value={{
				inquiries: { enabled: false },
				enabled: true,
				isEnterprise: true,
				agentAvailable: true,
				routeConfig: undefined,
				showOmnichannelQueueLink: true,
				isOverMacLimit: false,
				livechatPriorities: {
					data: livechatPriorities,
					isLoading: false,
					isError: false,
					enabled: true,
				},
			}}
		>
			{children}
		</OmnichannelContext.Provider>
	);
};
