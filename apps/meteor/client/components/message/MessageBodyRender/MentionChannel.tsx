import { UserMention as ASTUserMention } from '@rocket.chat/message-parser';
import React, { FC, memo } from 'react';

import { useMessageBodyChannelMentions, useMessageBodyChannelMentionClick } from './contexts/MessageBodyContext';

const Mention: FC<{ value: ASTUserMention['value'] }> = ({ value: { value: mention } }) => {
	const mentions = useMessageBodyChannelMentions();
	const mentioned = mentions.find((mentioned) => mentioned.name === mention);
	const onChannelMentionClick = useMessageBodyChannelMentionClick();

	return (
		<>
			{mentioned && (
				<span onClick={onChannelMentionClick(mentioned._id)} className='mention-link mention-link--room'>
					#{mention}
				</span>
			)}
			{!mentioned && `#${mention}`}
		</>
	);
};

export default memo(Mention);
