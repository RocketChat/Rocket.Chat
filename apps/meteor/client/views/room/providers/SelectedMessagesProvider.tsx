import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { selectedMessageStore } from './selectedMessageStore';
import { SelectedMessageContext } from '../MessageList/contexts/SelectedMessagesContext';

export { selectedMessageStore };

export type SelectedMessagesProviderProps = {
	children?: ReactNode;
};

export const SelectedMessagesProvider = ({ children }: SelectedMessagesProviderProps) => {
	const value = useMemo(
		() => ({
			selectedMessageStore,
		}),
		[],
	);

	return <SelectedMessageContext.Provider value={value}>{children}</SelectedMessageContext.Provider>;
};
