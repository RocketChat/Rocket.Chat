import { useLayout, useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { memo, ReactElement, useContext, useMemo } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type UserMentionElementProps = {
	mention: string;
};

const UserMentionElement = ({ mention }: UserMentionElementProps): ReactElement => {
	const { resolveUserMention, onUserMentionClick } = useContext(MarkupInteractionContext);

	const resolved = useMemo(() => resolveUserMention?.(mention), [mention, resolveUserMention]);
	const handleClick = useMemo(() => (resolved ? onUserMentionClick?.(resolved) : undefined), [resolved, onUserMentionClick]);

	const { isMobile } = useLayout();
	const uid = useUserId();
	const showRealName = Boolean(useSetting('UI_Use_Real_Name')) && !isMobile;

	if (mention === 'all') {
		return <span className='mention-link mention-link--all mention-link--group'>all</span>;
	}

	if (mention === 'here') {
		return <span className='mention-link mention-link--here mention-link--group'>here</span>;
	}

	if (!resolved) {
		return <>@{mention}</>;
	}

	return (
		<span
			className={resolved._id === uid ? 'mention-link mention-link--me mention-link--user' : 'mention-link mention-link--user'}
			title={resolved.username}
			onClick={handleClick}
			data-uid={resolved._id}
		>
			{(showRealName ? resolved.name : resolved.username) ?? mention}
		</span>
	);
};

export default memo(UserMentionElement);
