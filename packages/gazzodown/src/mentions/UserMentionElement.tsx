import { MessageHighlight } from '@rocket.chat/fuselage';
import { memo, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

export type UserMentionElementProps = {
	mention: string;
};

const handleUserMention = (mention: string | undefined, withSymbol: boolean | undefined): string | undefined =>
	withSymbol ? `@${mention}` : mention;

const UserMentionElement = ({ mention }: UserMentionElementProps) => {
	const { t } = useTranslation();
	const { resolveUserMention, onUserMentionClick, ownUserId, useRealName, showMentionSymbol, triggerProps } =
		useContext(MarkupInteractionContext);

	const resolved = useMemo(() => resolveUserMention?.(mention), [mention, resolveUserMention]);
	const handleMouseEnter = useMemo(() => (resolved ? onUserMentionClick?.(resolved) : undefined), [resolved, onUserMentionClick]);

	if (mention === 'all') {
		return (
			<MessageHighlight title={t('Mentions_all_room_members')} variant='relevant'>
				{handleUserMention('all', showMentionSymbol)}
			</MessageHighlight>
		);
	}

	if (mention === 'here') {
		return (
			<MessageHighlight title={t('Mentions_online_room_members')} variant='relevant'>
				{handleUserMention('here', showMentionSymbol)}
			</MessageHighlight>
		);
	}

	if (!resolved) {
		return <>@{mention}</>;
	}

	return (
		<MessageHighlight
			variant={resolved._id === ownUserId ? 'critical' : 'other'}
			title={resolved._id === ownUserId ? t('Mentions_you') : t('Mentions_user')}
			clickable
			onMouseEnter={handleMouseEnter}
			role={handleMouseEnter ? 'button' : undefined}
			tabIndex={handleMouseEnter ? 0 : undefined}
			aria-haspopup={handleMouseEnter ? 'dialog' : undefined}
			onKeyDown={
				handleMouseEnter &&
				((e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleMouseEnter(e);
					}
				})
			}
			{...triggerProps}
			data-uid={resolved._id}
		>
			{handleUserMention((useRealName ? resolved.name : resolved.username) ?? mention, showMentionSymbol)}
		</MessageHighlight>
	);
};

export default memo(UserMentionElement);
