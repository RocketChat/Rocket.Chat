import type { IUIActionButton, UIActionButtonContext } from '@rocket.chat/apps-engine/definition/ui';
import type { IMessage, IRoom, ISubscription, ITranslatedMessage, IUser } from '@rocket.chat/core-typings';
import type { UserCardContextValue } from '@rocket.chat/ui-contexts';

/** Who a message is shown as written by: its author with any name or username changed since it was sent */
export type MessageAuthor = IMessage['u'];

/** Opens the card of a user mentioned by a message row, and the attributes its trigger carries */
export type MessageListUserCard = Pick<UserCardContextValue, 'openUserCard' | 'triggerProps'>;

/** What every rendered message needs to know about the person looking at it */
export type MessageListViewer = {
	uid: string | undefined;
	username: string | undefined;
	useRealName: boolean;
	displayAvatars: boolean | undefined;
};

/**
 * What the message actions are decided from, for one room. Settings are kept as read, without defaults, so each
 * action applies the same default it always did.
 */
export type MessageActionsPolicy = {
	user: IUser | null;
	/** Whether this list has a chat to act through (composer, emoji picker, editing, deletion) */
	chatAvailable: boolean;
	quickReactions: { emoji: string; image: string }[];
	canDeleteMessage: (message: IMessage) => Promise<boolean>;
	settings: {
		allowStarring: boolean | undefined;
		allowPinning: boolean | undefined;
		threadsEnabled: boolean | undefined;
		autoTranslateEnabled: boolean | undefined;
		webdavEnabled: boolean | undefined;
		allowEditing: boolean | undefined;
		blockEditInMinutes: number | undefined;
		discussionEnabled: boolean | undefined;
	};
	permissions: {
		pinMessage: boolean;
		editMessage: boolean;
		bypassEditTimeLimit: boolean;
		startDiscussion: boolean;
		startDiscussionOtherUser: boolean;
		autoTranslate: boolean;
		createDirectMessage: boolean;
		postReadOnly: boolean;
	};
};

/**
 * What can be done to a message. The list's provider decides how each one is carried out — which modal, which toast,
 * where to navigate — so the toolbar and its items only say which action was chosen.
 */
export type MessageActions = {
	pin: (message: IMessage) => void;
	unpin: (message: IMessage) => void;
	star: (message: IMessage) => Promise<void>;
	unstar: (message: IMessage) => Promise<void>;
	setFollowing: (message: IMessage, room: Pick<IRoom, '_id'>, follow: boolean) => void;
	markAsUnread: (message: IMessage, subscription: ISubscription) => Promise<void>;
	toggleTranslation: (message: IMessage & { autoTranslateShowInverse?: boolean }, language: string, hasTranslations: boolean) => void;
	replyInDirectMessage: (message: IMessage) => void;
	copyText: (message: IMessage) => Promise<void>;
	copyLink: (message: IMessage) => Promise<void>;
	edit: (message: IMessage) => Promise<void>;
	requestDeletion: (message: IMessage) => Promise<void>;
	report: (message: IMessage) => void;
	showReactions: (message: IMessage) => void;
	showReadReceipts: (message: IMessage) => void;
	startDiscussion: (message: IMessage, room: IRoom) => void;
	saveToWebdav: (message: IMessage) => void;
	forward: (message: IMessage) => Promise<void>;
	quote: (message: IMessage & Partial<ITranslatedMessage>) => void;
	react: (message: IMessage, emoji: string) => void;
	toggleReaction: (message: IMessage, reaction: string) => void;
	openReactionPicker: (message: IMessage, anchor: Element) => void;
	replyInThread: (message: IMessage) => void;
	jumpTo: (message: IMessage) => void;
	runAppAction: (action: IUIActionButton & { context: UIActionButtonContext.MESSAGE_ACTION }, message: IMessage) => void;
};

export const defaultMessageListViewer: MessageListViewer = {
	uid: undefined,
	username: undefined,
	useRealName: false,
	displayAvatars: undefined,
};

export const denyingMessageActionsPolicy: MessageActionsPolicy = {
	user: null,
	chatAvailable: false,
	quickReactions: [],
	canDeleteMessage: () => Promise.resolve(false),
	settings: {
		allowStarring: false,
		allowPinning: false,
		threadsEnabled: false,
		autoTranslateEnabled: false,
		webdavEnabled: false,
		allowEditing: false,
		blockEditInMinutes: undefined,
		discussionEnabled: false,
	},
	permissions: {
		pinMessage: false,
		editMessage: false,
		bypassEditTimeLimit: false,
		startDiscussion: false,
		startDiscussionOtherUser: false,
		autoTranslate: false,
		createDirectMessage: false,
		postReadOnly: false,
	},
};

const noop = () => undefined;
const resolved = () => Promise.resolve();

export const inertMessageListUserCard: MessageListUserCard = {
	openUserCard: noop,
	triggerProps: {},
};

export const inertMessageActions: MessageActions = {
	pin: noop,
	unpin: noop,
	star: resolved,
	unstar: resolved,
	setFollowing: noop,
	markAsUnread: resolved,
	toggleTranslation: noop,
	replyInDirectMessage: noop,
	copyText: resolved,
	copyLink: resolved,
	edit: resolved,
	requestDeletion: resolved,
	report: noop,
	showReactions: noop,
	showReadReceipts: noop,
	startDiscussion: noop,
	saveToWebdav: noop,
	forward: resolved,
	quote: noop,
	react: noop,
	openReactionPicker: noop,
	toggleReaction: noop,
	replyInThread: noop,
	jumpTo: noop,
	runAppAction: noop,
};
