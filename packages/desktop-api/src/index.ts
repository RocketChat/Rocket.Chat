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

export type CustomNotificationOptions = {
	type: 'voice' | 'text';
	id?: string;
	payload: {
		title: string;
		body: string;
		avatar?: string;
		silent?: boolean;
		requireInteraction?: boolean;
	};
};

export type DesktopUserStatus = 'online' | 'away' | 'busy' | 'offline';

export type DesktopUserPresence = {
	loggedIn: boolean;
	connection: 'connected' | 'connecting' | 'disconnected';
	status?: DesktopUserStatus;
	statusText?: string;
	statusExpiresAt?: string;
	availableStatuses: DesktopUserStatus[];
	customStatuses: DesktopCustomUserStatus[];
};

export type DesktopCustomUserStatus = {
	id: string;
	name: string;
	status: DesktopUserStatus;
};

export type DesktopUserStatusChangeRequest = {
	status: DesktopUserStatus;
	customStatusId?: string;
};

export type E2EESearchDocKind = 'text' | 'file' | 'attachment';

/** One decrypted message, attachment or file name of an end-to-end encrypted room, as the local search index stores it. */
export type E2EESearchDoc = {
	id: string;
	rid: string;
	tmid?: string;
	uid: string;
	username: string;
	ts: number;
	updatedAt: number;
	kind: E2EESearchDocKind;
	body: string;
};

export type E2EESearchQuery = {
	text: string;
	rid?: string;
	uid?: string;
	from?: number;
	to?: number;
	order?: 'relevance' | 'recent';
	limit?: number;
};

export type E2EESearchHit = {
	id: string;
	rid: string;
	tmid?: string;
	/** The author, as the indexed document stores it. */
	uid: string;
	username: string;
	ts: number;
	/** HTML: the message text is escaped, and only `<mark>` tags are added. */
	snippet: string;
};

export type E2EESearchRoomState = {
	lastUpdate?: number;
	backfillCursor?: string;
	backfillDone: boolean;
};

export type E2EESearchStats = { docs: number; bytes: number; rooms: number };

export type E2EESearchOpenResult = {
	schemaVersion: number;
	encryptedAtRest: boolean;
	/**
	 * True when the open had no wrap key and the server holds an E2EE key for the user (or cannot tell): the desktop app
	 * opened no index and wrote nothing. Each index call fails until an open with the wrap key (after E2EE unlock).
	 */
	locked?: true;
};

export type E2EESearchScope = {
	userId: string;
	/**
	 * 32 bytes derived from the user's E2EE private key, never the private key itself. With it, the index opens only for
	 * the same key, so it survives a logout and no server can open it for another user.
	 */
	wrapKey?: Uint8Array;
};

/** A local full-text index of decrypted end-to-end encrypted messages. The plaintext never leaves the user's device. */
export interface ISearchIndexBackend {
	open(scope: E2EESearchScope): Promise<E2EESearchOpenResult>;
	upsert(docs: E2EESearchDoc[]): Promise<void>;
	remove(ids: string[]): Promise<void>;
	removeRoom(rid: string): Promise<void>;
	/**
	 * The rooms that have rows in the index, sorted. The web client removes the rooms that the user left while the index was
	 * closed.
	 */
	listRooms(): Promise<string[]>;
	search(query: E2EESearchQuery): Promise<E2EESearchHit[]>;
	getRoomState(rid: string): Promise<E2EESearchRoomState | undefined>;
	setRoomState(rid: string, state: E2EESearchRoomState): Promise<void>;
	stats(): Promise<E2EESearchStats>;
	/**
	 * Deletes the open index. With a scope and no open index (E2EE locked), deletes the index of that user, whom the
	 * desktop app checks against the login session.
	 */
	wipe(scope?: { userId: string }): Promise<void>;
	/**
	 * Closes the open index and keeps it on disk, so the same user opens it again at the next login. Desktop versions
	 * without it close the index themselves at logout.
	 */
	close?(): Promise<void>;
}

/**
 * The version of this contract the web client implements. A web client that announces version 1 pushes the server info,
 * URL resolver, title, favicon, user roles, badge, login state, unread alert preference, git commit hash and Outlook
 * credentials through the bridge itself, so the desktop app has no reason to read those from the web client's modules.
 * Version 1 does not cover presence.
 */
export type WebClientBridgeVersion = 1;

/** The `CustomEvent`s the web client fires on `window` for the desktop app. Renaming one breaks the apps in the field. */
export type DesktopWindowEvent =
	| 'startup'
	| 'unread-changed'
	| 'unread-changed-by-subscription'
	| 'status-changed'
	| 'Custom_Script_Logged_In'
	| 'Custom_Script_Logged_Out';

export interface IRocketChatDesktop {
	/** Announces which version of this contract the web client implements (see `WebClientBridgeVersion`). */
	setWebClientBridgeVersion?: (version: WebClientBridgeVersion) => void;
	/** Whether the user wants the unread indicator in the badge (the `unreadAlert` preference). */
	setUnreadAlertEnabled?: (enabled: boolean) => void;
	dispatchCustomNotification: (options: CustomNotificationOptions) => void;
	closeCustomNotification: (id: string) => void;
	onReady: (cb: (serverInfo: ServerInfo) => void) => void;
	setServerInfo: (serverInfo: ServerInfo) => void;
	setUrlResolver: (getAbsoluteUrl: (relativePath?: string) => string) => void;
	setBadge: (badge: Badge) => void;
	setFavicon: (faviconUrl: string) => void;
	setBackground: (imageUrl: string) => void;
	setSidebarCustomTheme: (customTheme: string) => void;
	setTitle: (title: string) => void;
	setUserLoggedIn: (userLoggedIn: boolean) => void;
	setUserRoles: (roles: string[]) => void;
	setUserPresenceDetection: (options: {
		isAutoAwayEnabled: boolean;
		idleThreshold: number | null;
		setUserOnline: (online: boolean) => void;
	}) => void;
	setUserPresenceState?: (presence: DesktopUserPresence) => void;
	setUserStatusChangeHandler?: (handler: (request: DesktopUserStatusChangeRequest) => Promise<void>) => void;
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
	supportedDocumentViewerFormats?: () => string[];
	reloadServer: () => void;
	getE2ePdfPreviewSizeLimit: () => number;
	openInBrowser: (url: string) => void;
	/**
	 * Present only in the desktop app's video call window (4.18 and later), whose `RocketChatDesktop` carries this and
	 * nothing of the main window's but no-op setters.
	 */
	videoCall?: IVideoCallWindow;
	/** Present only in desktop versions that keep a local search index of end-to-end encrypted messages. */
	e2eeSearch?: ISearchIndexBackend;
}

/** What the desktop app's video call window offers the page loaded in it. */
export interface IVideoCallWindow {
	openInMainWindow: (path: string) => void;
	close: () => void;
	requestScreenSharing: () => Promise<string | null>;
	/** @deprecated Removed in desktop 4.18, and never used: it handed the user's session token to the provider's page. */
	getAuthCredentials?: () => Promise<{ userId: string; authToken: string; serverUrl: string } | null>;
}
