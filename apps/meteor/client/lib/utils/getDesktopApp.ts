type OutlookEventsResponse = { status: 'success' | 'canceled' };

type WindowMaybeDesktop = typeof window & {
	RocketChatDesktop?: {
		openInternalVideoChatWindow?: (url: string, options: undefined) => void;
		getOutlookEvents: (date: Date) => Promise<OutlookEventsResponse>;
		setOutlookExchangeUrl: (url: string, userId: string) => Promise<void>;
		hasOutlookCredentials: () => Promise<boolean>;
		clearOutlookCredentials: () => void;
	};
};

export const getDesktopApp = (): WindowMaybeDesktop['RocketChatDesktop'] => {
	return (window as WindowMaybeDesktop).RocketChatDesktop;
};
