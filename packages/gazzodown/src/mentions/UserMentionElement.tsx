import { Palette } from '@rocket.chat/fuselage';
import styled from '@rocket.chat/styled';
import { useLayout, useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { memo, ReactElement, useContext, useMemo } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type UserMentionElementProps = {
	mention: string;
};

const GroupMention = styled('span')`
	color: ${Palette.statusColor['status-font-on-warning'].toString()};
	font-weight: 700;
	font-size: 0.875rem;
	line-height: 1.25rem;
`;

const UserMention = styled('span', ({ own: _own, ...props }: { own: boolean }) => props)`
	cursor: pointer;
	color: ${(p): string => Palette.statusColor[p.own ? 'status-font-on-danger' : 'status-font-on-info'].toString()};
	font-weight: 700;
	font-size: 0.875rem;
	line-height: 1.25rem;
	&:hover {
		text-decoration: underline;
	}
`;

const UserMentionElement = ({ mention }: UserMentionElementProps): ReactElement => {
	const { resolveUserMention, onUserMentionClick } = useContext(MarkupInteractionContext);

	const resolved = useMemo(() => resolveUserMention?.(mention), [mention, resolveUserMention]);
	const handleClick = useMemo(() => (resolved ? onUserMentionClick?.(resolved) : undefined), [resolved, onUserMentionClick]);

	const { isMobile } = useLayout();
	const uid = useUserId();
	const showRealName = useSetting<boolean>('UI_Use_Real_Name') && !isMobile;

	if (mention === 'all') {
		return <GroupMention>@all</GroupMention>;
	}

	if (mention === 'here') {
		return <GroupMention>@here</GroupMention>;
	}

	if (!resolved) {
		return <>@{mention}</>;
	}

	return (
		<UserMention
			// className={resolved._id === uid ? 'mention-link mention-link--me mention-link--user' : 'mention-link mention-link--user'}
			own={resolved._id === uid}
			title={resolved.username || resolved.name}
			onClick={handleClick}
			data-uid={resolved._id}
		>
			@{(showRealName ? resolved.name : resolved.username) ?? mention}
		</UserMention>
	);
};

export default memo(UserMentionElement);
