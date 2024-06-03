type OutlookEventsResponse = { status: 'success' | 'canceled' };

export interface IRocketChatDesktop {
	openInternalVideoChatWindow?: (url: string, options: { providerName: string | undefined }) => void;
	getOutlookEvents?: (date: Date) => Promise<OutlookEventsResponse>;
	setOutlookExchangeUrl?: (url: string, userId: string) => Promise<void>;
	hasOutlookCredentials?: () => Promise<boolean>;
	clearOutlookCredentials?: () => void;
	openDocumentViewer?: (url: string, format: string, options: any) => void;
}
