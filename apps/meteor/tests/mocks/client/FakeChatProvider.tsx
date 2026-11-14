import type { ReactNode } from 'react';

import { ChatContext } from '../../../client/views/room/contexts/ChatContext';

export type FakeChatProviderProps = {
	children?: ReactNode;
};

const FakeChatProvider = ({ children }: FakeChatProviderProps) => {
	return (
		<ChatContext.Provider
			value={
				{
					data: {},
				} as any
			}
		>
			{children}
		</ChatContext.Provider>
	);
};

export default FakeChatProvider;
