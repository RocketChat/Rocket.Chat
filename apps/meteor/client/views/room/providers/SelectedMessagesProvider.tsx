import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { selectedMessageStore } from './SelectedMessageStore';
import { SelectedMessageContext } from './SelectedMessagesContext';

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

export { SelectedMessageStore, selectedMessageStore } from './SelectedMessageStore';
