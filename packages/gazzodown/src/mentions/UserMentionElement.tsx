import { Message } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { memo, ReactElement, useContext, useMemo } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type UserMentionElementProps = {
	mention: string;
};

const handleUserMention = (mention: string | undefined, withSymbol: boolean | undefined): string | undefined =>
	withSymbol ? `@${mention}` : mention;

const UserMentionElement = ({ mention }: UserMentionElementProps): ReactElement => {
	const t = useTranslation();
	const { resolveUserMention, onUserMentionClick, ownUserId, useRealName, showMentionSymbol } = useContext(MarkupInteractionContext);

	const resolved = useMemo(() => resolveUserMention?.(mention), [mention, resolveUserMention]);
	const handleClick = useMemo(() => (resolved ? onUserMentionClick?.(resolved) : undefined), [resolved, onUserMentionClick]);

	if (mention === 'all') {
		return (
			<Message.Highlight title={t('Mentions_all_room_members')} variant='relevant'>
				{handleUserMention('all', showMentionSymbol)}
			</Message.Highlight>
		);
	}

	if (mention === 'here') {
		return (
			<Message.Highlight title={t('Mentions_online_room_members')} variant='relevant'>
				{handleUserMention('here', showMentionSymbol)}
			</Message.Highlight>
		);
	}

	if (!resolved) {
		return <>@{mention}</>;
	}

	return (
		<Message.Highlight
			variant={resolved._id === ownUserId ? 'critical' : 'other'}
			title={resolved._id === ownUserId ? t('Mentions_you') : t('Mentions_user')}
			clickable
			onClick={handleClick}
			data-uid={resolved._id}
		>
			{handleUserMention((useRealName ? resolved.name : resolved.username) ?? mention, showMentionSymbol)}
		</Message.Highlight>
	);
};

export default memo(UserMentionElement);
