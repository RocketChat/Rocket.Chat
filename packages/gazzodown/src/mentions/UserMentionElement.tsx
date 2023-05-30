import { Message } from '@rocket.chat/fuselage';
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
	const showRealName = useSetting<boolean>('UI_Use_Real_Name') && !isMobile;

	if (mention === 'all') {
		return (
			<Message.Mention tag='@' variant='relevant'>
				all
			</Message.Mention>
		);
	}

	if (mention === 'here') {
		return (
			<Message.Mention tag='@' variant='relevant'>
				here
			</Message.Mention>
		);
	}

	if (!resolved) {
		return <>@{mention}</>;
	}

	return (
		<Message.Mention
			tag='@'
			variant={resolved._id === uid ? 'critical' : 'other'}
			title={resolved.username || resolved.name}
			clickable
			onClick={handleClick}
			data-uid={resolved._id}
		>
			{(showRealName ? resolved.name : resolved.username) ?? mention}
		</Message.Mention>
	);
};

export default memo(UserMentionElement);
