import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const useUnreadDisplay = ({
	mentions,
	threads,
	groupMentions,
	total,
}: {
	mentions: number;
	threads: number;
	groupMentions: number;
	total: number;
}) => {
	const { t } = useTranslation();

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

	return { unreadTitle, unreadVariant };
};
