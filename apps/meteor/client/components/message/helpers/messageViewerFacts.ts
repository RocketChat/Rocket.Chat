import type { IMessage } from '@rocket.chat/core-typings';
import { isThreadMainMessage } from '@rocket.chat/core-typings';

/** Whether the viewer starred this message */
export const isMessageStarredBy = (message: IMessage, uid: string | undefined): boolean =>
	Boolean(uid && Array.isArray(message.starred) && message.starred.some((star) => star._id === uid));

/** Whether the viewer follows the thread this message replies to; a thread's own main message shows its follow state elsewhere */
export const isMessageFollowedBy = (message: IMessage, uid: string | undefined): boolean =>
	Boolean(uid && message.replies?.includes(uid) && !isThreadMainMessage(message));

/** Whether the viewer is among those who reacted with this reaction */
export const hasUserReacted = (message: IMessage, username: string | undefined, reaction: string): boolean =>
	Boolean(username && message.reactions?.[reaction]?.usernames.includes(username));
