import { UserMention as ASTUserMention } from '@rocket.chat/message-parser';
import { useUserId } from '@rocket.chat/ui-contexts';
import React, { FC, memo } from 'react';

import { useMessageBodyUserMentions, useMessageBodyMentionClick } from './contexts/MessageBodyContext';

const Mention: FC<{ value: ASTUserMention['value'] }> = ({ value: { value: mention } }) => {
	const uid = useUserId();
	const mentions = useMessageBodyUserMentions();
	const mentioned = mentions.find((mentioned) => mentioned.username === mention);
	const onUserMentionClick = useMessageBodyMentionClick();
	const classNames = ['mention-link'];
	if (mention === 'all') {
		classNames.push('mention-link--all');
		classNames.push('mention-link--group');
	} else if (mention === 'here') {
		classNames.push('mention-link--here');
		classNames.push('mention-link--group');
	} else if (mentioned && mentioned._id === uid) {
		classNames.push('mention-link--me');
		classNames.push('mention-link--user');
	} else {
		classNames.push('mention-link--user');
	}
	return (
		<>
			{mentioned && (
				<span
					onClick={classNames.includes('mention-link--user') ? onUserMentionClick(mention) : undefined}
					className={classNames.join(' ')}
				>
					{mentioned.name || mention}
				</span>
			)}
			{!mentioned && `@${mention}`}
		</>
	);
};

export default memo(Mention);
