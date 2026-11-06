import { Badge, Icon, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import type { ConferencePanel } from '../context/ConferenceContext';
import type { ConferenceRoom } from '../context/definitions';

export type ConferencePanelTogglesProps = {
	activePanel: ConferencePanel | undefined;
	presentCount: number;
	unread: ConferenceRoom['unread'];
	onToggle: (panel: ConferencePanel) => void;
};

const ConferencePanelToggles = ({ activePanel, presentCount, unread: roomUnread, onToggle }: ConferencePanelTogglesProps) => {
	const { t } = useTranslation();
	const chatVisible = activePanel === 'chat';

	const { count: unreadCount, hasUnseenActivity, variant: unreadVariant, title: unreadTitle = '' } = roomUnread;
	// Nothing is unread about a chat the reader is looking at.
	const unread = chatVisible ? 0 : unreadCount;
	const showChatBadge = !chatVisible && (unread > 0 || hasUnseenActivity);

	return (
		<>
			<IconButton
				size='small'
				variant='secondary'
				// The same words in both, because they disagreed: the tooltip said "People" while the accessible
				// name said how many, so anything looking for the button by the name it appeared to have never
				// found it.
				aria-label={t('__count__people_in_the_call', { count: presentCount })}
				title={t('__count__people_in_the_call', { count: presentCount })}
				aria-pressed={activePanel === 'members'}
				onClick={() => onToggle('members')}
				icon={<Icon name='members' size='x20' color={activePanel === 'members' ? 'info' : undefined} />}
				badge={presentCount > 0 ? <Badge>{presentCount}</Badge> : undefined}
			/>
			<IconButton
				size='small'
				variant='secondary'
				// The badge is `aria-hidden`, so what it says has to be in the button's name.
				aria-label={showChatBadge && unreadTitle ? `${t('Chat')}, ${unreadTitle}` : t('Chat')}
				title={t('Chat')}
				aria-pressed={chatVisible}
				onClick={() => onToggle('chat')}
				icon={<Icon name='balloon' size='x20' color={chatVisible ? 'info' : undefined} />}
				// An empty badge is the dot: activity with no count behind it.
				badge={
					showChatBadge ? (
						<Badge variant={unreadVariant} title={unreadTitle}>
							{unread > 0 ? unread : null}
						</Badge>
					) : undefined
				}
			/>
		</>
	);
};

export default ConferencePanelToggles;
