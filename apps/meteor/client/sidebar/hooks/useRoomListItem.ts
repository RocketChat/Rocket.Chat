import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';

import { useUserStatusTooltip } from '../../hooks/useUserStatusTooltip';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { getSubscriptionDraft } from '../../lib/utils/getSubscriptionDraft';
import { getUidDirectMessage } from '../../lib/utils/getUidDirectMessage';
import { getMessagePreview } from '../../lib/utils/normalizeMessagePreview/getMessagePreview';
import { getUnreadDisplay } from '../lib/unreadDisplay';
import type { UnreadVariant } from '../lib/unreadDisplay';

export type RoomListItem = {
	href: string;
	title: string;
	/** What a reader is told the row is, which is not always what is written on it. */
	ariaLabel: string;
	/** Present only for a direct message, and only then is there a status to hover. */
	dmUserId?: string;
	dmStatusTooltipHandlers: ReturnType<typeof useUserStatusTooltip>;
	isQueued: boolean;
	/** The message being written here and not sent, if there is one, as the label for saying so. */
	draftHint?: string;
	/** Already-escaped preview markup, asked for only when the row is tall enough to show one. */
	messagePreviewHtml?: string;
	unread: {
		show: boolean;
		title: string;
		total: number;
		threads: number;
		variant: UnreadVariant;
		/** Whether the row as a whole should stand out, which is more than having a number on it. */
		highlighted: boolean;
	};
};

/**
 * Turns a subscription into the things a row says about it. What draws them is the caller's;
 * a second sidebar asks the same question and answers it with its own markup.
 */
export const useRoomListItem = (
	room: SubscriptionWithRoom,
	{ userId, t, extended }: { userId?: string; t: TFunction; extended: boolean },
): RoomListItem => {
	const href = roomCoordinator.getRouteLink(room.t, room) || '';
	const title = roomCoordinator.getRoomName(room.t, room) || '';

	const dmUserId = getUidDirectMessage(room, userId);
	const dmStatusTooltipHandlers = useUserStatusTooltip(dmUserId, title);

	const { unreadTitle, unreadVariant, showUnread, unreadCount, highlightUnread } = getUnreadDisplay(room, t);

	const draft = getSubscriptionDraft(room);
	const preview = extended ? getMessagePreview(room, room.lastMessage, t) : undefined;

	return {
		href,
		title,
		ariaLabel: showUnread ? t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle: title }) : title,
		dmUserId,
		dmStatusTooltipHandlers,
		isQueued: isOmnichannelRoom(room) && room.status === 'queued',
		draftHint: draft ? t(room.draft ? 'Unfinished_message' : 'Unfinished_thread_message') : undefined,
		messagePreviewHtml: preview || undefined,
		unread: {
			show: showUnread,
			title: unreadTitle,
			total: unreadCount.total,
			threads: unreadCount.threads,
			variant: unreadVariant,
			highlighted: highlightUnread,
		},
	};
};
