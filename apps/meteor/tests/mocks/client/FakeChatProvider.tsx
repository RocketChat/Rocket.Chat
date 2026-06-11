import type { ReactNode } from 'react';

import { ChatContext } from '../../../client/views/room/contexts/ChatContext';
import { createFakeSubscription } from '../data';

type FakeChatProviderProps = {
	children?: ReactNode;
};

const FakeChatProvider = ({ children }: FakeChatProviderProps) => {
	return (
		<ChatContext.Provider
			value={
				{
					data: {
						getSubscriptionFromMessage: async () => {
							return createFakeSubscription();
						},
					},
				} as any
			}
		>
			{children}
		</ChatContext.Provider>
	);
};

export default FakeChatProvider;
