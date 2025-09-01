export type ServerInfo = {
	version: string;
};

export type Badge = '•' | number;

export type ThemeAppearance = 'dark' | 'light' | 'auto' | 'high-contrast' | undefined;

export type VideoChatWindowOptions = {
	providerName?: string | undefined;
};

export type OutlookEventsResponse = {
	status: 'success' | 'canceled';
};

export interface IRocketChatDesktop {
	onReady: (cb: (serverInfo: ServerInfo) => void) => void;
	setServerInfo: (serverInfo: ServerInfo) => void;
	setUrlResolver: (getAbsoluteUrl: (relativePath?: string) => string) => void;
	setBadge: (badge: Badge) => void;
	setFavicon: (faviconUrl: string) => void;
	setBackground: (imageUrl: string) => void;
	setSidebarCustomTheme: (customTheme: string) => void;
	setTitle: (title: string) => void;
	setUserLoggedIn: (userLoggedIn: boolean) => void;
	setUserPresenceDetection: (options: {
		isAutoAwayEnabled: boolean;
		idleThreshold: number | null;
		setUserOnline: (online: boolean) => void;
	}) => void;
	setUserThemeAppearance: (themeAppearance: ThemeAppearance) => void;
	createNotification: (
		options: NotificationOptions & {
			canReply?: boolean;
			title: string;
			onEvent: (eventDescriptor: { type: string; detail: unknown }) => void;
		},
	) => Promise<unknown>;
	destroyNotification: (id: unknown) => void;
	getInternalVideoChatWindowEnabled: () => boolean;
	openInternalVideoChatWindow: (url: string, options: VideoChatWindowOptions) => void;
	setGitCommitHash: (gitCommitHash: string) => void;
	writeTextToClipboard: (text: string) => void;
	getOutlookEvents: (date: Date) => Promise<OutlookEventsResponse>;
	setOutlookExchangeUrl: (url: string, userId: string) => void;
	hasOutlookCredentials: () => Promise<boolean>;
	clearOutlookCredentials: () => void;
	setUserToken: (token: string, userId: string) => void;
	openDocumentViewer: (url: string, format: string, options: any) => void;
}
