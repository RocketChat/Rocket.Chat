import { styled, Text } from '@tamagui/web';
import type { ReactNode } from 'react';

import { textIconColors } from '../../../Theme';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { textScale } from '../messageStyles';

const MessageStatusIndicatorTextFrame = styled(Text, {
	render: 'span',
	whiteSpace: 'nowrap',
	wordWrap: 'inherit',
	color: String(textIconColors['font-secondary-info']),
	...textScale('c1'),
});

export type MessageStatusIndicatorTextProps = {
	children: ReactNode;
};

const MessageStatusIndicatorText = ({ children }: MessageStatusIndicatorTextProps) => (
	<MessageStatusIndicatorTextFrame className='rcx-message-status-indicator__text' aria-hidden>
		{children}
	</MessageStatusIndicatorTextFrame>
);

export default withFuselageProvider(MessageStatusIndicatorText);
