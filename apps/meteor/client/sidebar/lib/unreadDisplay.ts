import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';

const getUnreadTitle = (
	{
		mentions,
		threads,
		groupMentions,
		total,
	}: {
		mentions: number;
		threads: number;
		groupMentions: number;
		total: number;
	},
	t: TFunction,
) => {
	const title = [] as string[];
	if (mentions) {
		title.push(t('mentions_counter', { count: mentions }));
	}
	if (threads) {
		title.push(t('threads_counter', { count: threads }));
	}
	if (groupMentions) {
		title.push(t('group_mentions_counter', { count: groupMentions }));
	}
	const count = total - mentions - groupMentions - threads;
	if (count > 0) {
		title.push(t('unread_messages_counter', { count }));
	}

	return title.join(', ');
};

export type UnreadVariant = 'primary' | 'warning' | 'danger' | 'secondary';

export type UnreadData = Pick<
	SubscriptionWithRoom,
	'alert' | 'userMentions' | 'unread' | 'tunread' | 'tunreadUser' | 'groupMentions' | 'hideMentionStatus' | 'hideUnreadStatus'
>;

/**
 * What a room's unread state looks like once said out loud: how many, which colour it earns, what a
 * reader is told, and whether the whole row should stand out. Takes its translator rather than
 * reaching for one, so a list can ask this per row without a context read per row.
 */
export const getUnreadDisplay = (
	{ userMentions, tunreadUser, tunread, unread, groupMentions, hideMentionStatus, hideUnreadStatus, alert }: UnreadData,
	t: TFunction,
) => {
	const unreadCount = {
		mentions: userMentions + (tunreadUser?.length || 0),
		threads: tunread?.length || 0,
		groupMentions,
		total: unread + (tunread?.length || 0),
	};

	const unreadTitle = getUnreadTitle(unreadCount, t);

	const unreadVariant: UnreadVariant =
		(unreadCount.mentions && 'danger') || (unreadCount.threads && 'primary') || (unreadCount.groupMentions && 'warning') || 'secondary';

	const showUnread =
		(!hideUnreadStatus || (!hideMentionStatus && (Boolean(unreadCount.mentions) || Boolean(unreadCount.groupMentions)))) &&
		Boolean(unreadCount.total);

	const highlightUnread = Boolean(!hideUnreadStatus && (alert || unread));

	return { unreadTitle, unreadVariant, showUnread, unreadCount, highlightUnread };
};

export type UnreadDisplay = ReturnType<typeof getUnreadDisplay>;
