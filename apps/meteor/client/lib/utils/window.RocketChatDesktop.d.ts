type OutlookEventsResponse = { status: 'success' | 'canceled' };

// eslint-disable-next-line @typescript-eslint/naming-convention
interface Window {
	RocketChatDesktop:
		| {
				openInternalVideoChatWindow?: (url: string, options: undefined) => void;
				getOutlookEvents?: (date: Date) => Promise<OutlookEventsResponse>;
				setOutlookExchangeUrl?: (url: string, userId: string) => Promise<void>;
				hasOutlookCredentials?: () => Promise<boolean>;
				clearOutlookCredentials?: () => void;
		  }
		| undefined;
}
