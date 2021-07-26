import { Box } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import MarkdownText from '../../../../../../../client/components/MarkdownText';
import { IOmnichannelRoom } from '../../../../../../../definition/IRoom';
import { parsePlaceHolder } from '../../parsePlaceholder';

const PreviewText: FC<{ text: string; room?: IOmnichannelRoom }> = ({ text, room }) => {
	text = room ? parsePlaceHolder(text, room) : text;

	return (
		<Box
			rows={10}
			display='flex'
			flexDirection='column'
			pbs='12px'
			pi='16px'
			pbe='16px'
			rcx-box--animated
			rcx-input-box__wrapper
		>
			<MarkdownText content={text} parseEmoji={true} />
		</Box>
	);
};

export default memo(PreviewText);
