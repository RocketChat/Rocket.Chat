import type { ILivechatPriority, Serialized } from '@rocket.chat/core-typings';
import { type ContextType, type ReactNode, useSyncExternalStore } from 'react';

import { OmnichannelContext } from '../OmnichannelContext';

type OmnichannelContextValue = ContextType<typeof OmnichannelContext>;

export const mockOmnichannelProvider = (partialContextValue?: Partial<OmnichannelContextValue>) => {
	const contextValue: OmnichannelContextValue = {
		inquiries: { enabled: false },
		enabled: false,
		isEnterprise: false,
		agentAvailable: false,
		showOmnichannelQueueLink: false,
		isOverMacLimit: false,
		livechatPriorities: {
			data: [],
			isLoading: false,
			isError: false,
			enabled: false,
		},
		...partialContextValue,
	};

	const subscribers = new Set<() => void>();

	const getSnapshot = () => contextValue;

	const subscribe = (callback: () => void) => {
		subscribers.add(callback);

		return () => {
			subscribers.delete(callback);
		};
	};

	const MockedOmnichannelProvider = ({ children }: { children: ReactNode }) => (
		<OmnichannelContext.Provider children={children} value={useSyncExternalStore(subscribe, getSnapshot)} />
	);

	MockedOmnichannelProvider.withLivechatPriorities = (priorities: Serialized<ILivechatPriority>[]) => {
		contextValue.livechatPriorities = {
			data: priorities,
			isLoading: false,
			isError: false,
			enabled: true,
		};
		subscribers.forEach((callback) => callback());
		return MockedOmnichannelProvider;
	};

	return MockedOmnichannelProvider;
};
