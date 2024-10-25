import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const useUnreadDisplay = ({
	alert,
	userMentions,
	unread,
	tunread,
	tunreadUser,
	groupMentions: groupMentionsProp,
	hideMentionStatus,
	hideUnreadStatus,
}: ISubscription & IRoom) => {
	const { t } = useTranslation();

	const unreadCount = useMemo(() => {
		return {
			mentions: userMentions + (tunreadUser?.length || 0),
			threads: tunread?.length || 0,
			groupMentions: groupMentionsProp,
			total: unread + (tunread?.length || 0),
		};
	}, [groupMentionsProp, tunread?.length, tunreadUser?.length, unread, userMentions]);

	const { groupMentions, mentions, threads, total } = unreadCount;

	const unreadTitle = useMemo(() => {
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
	}, [groupMentions, mentions, t, threads, total]);

	const unreadVariant = useMemo(
		() => (mentions && 'danger') || (threads && 'primary') || (groupMentions && 'warning') || 'secondary',
		[groupMentions, mentions, threads],
	) as 'danger' | 'primary' | 'warning' | 'secondary';

	const showUnread = (!hideUnreadStatus || (!hideMentionStatus && (Boolean(mentions) || Boolean(groupMentions)))) && Boolean(total);

	const highlightUnread = Boolean(!hideUnreadStatus && (alert || unread));

	return { unreadTitle, unreadVariant, showUnread, unreadCount, highlightUnread };
};
