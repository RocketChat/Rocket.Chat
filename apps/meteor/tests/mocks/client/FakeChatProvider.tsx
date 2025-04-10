import { createFakeSubscription } from '@rocket.chat/mock-providers';
import type { ReactElement, ReactNode } from 'react';

import { ChatContext } from '../../../client/views/room/contexts/ChatContext';

type FakeChatProviderProps = {
	children?: ReactNode;
};

const FakeChatProvider = ({ children }: FakeChatProviderProps): ReactElement => {
	return (
		<ChatContext.Provider
			children={children}
			value={
				{
					data: {
						getSubscriptionFromMessage: async () => {
							return createFakeSubscription();
						},
					},
				} as any
			}
		/>
	);
};

export default FakeChatProvider;
