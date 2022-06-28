import React, { memo, ReactElement } from 'react';

import { useMessageBodyChannelMentions, useMessageBodyChannelMentionClick } from '../MarkupInteractionContext';

type ChannelMentionElementProps = {
	mention: string;
};

const ChannelMentionElement = ({ mention }: ChannelMentionElementProps): ReactElement => {
	const mentions = useMessageBodyChannelMentions();
	const mentioned = mentions.find((mentioned) => mentioned.name === mention);
	const onChannelMentionClick = useMessageBodyChannelMentionClick();

	if (!mentioned) {
		return <>#{mention}</>;
	}

	return (
		<span className='mention-link mention-link--room' onClick={onChannelMentionClick(mentioned._id)}>
			#{mention}
		</span>
	);
};

export default memo(ChannelMentionElement);
