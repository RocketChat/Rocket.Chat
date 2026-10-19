import { styled, Text } from '@tamagui/web';
import type { ReactNode } from 'react';

import { textIconColors } from '../../../Theme';
import { spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { boxText, textScale, truncatedText } from '../messageStyles';

const MessageSystemTimestampFrame = styled(Text, {
	render: 'span',
	...boxText,
	...textScale('c1'),
	...truncatedText,
	flexShrink: 0,
	marginInline: spacing('x2'),
	color: String(textIconColors['font-secondary-info']),
});

export type MessageSystemTimestampProps = {
	children: ReactNode;
	title?: string;
};

const MessageSystemTimestamp = (props: MessageSystemTimestampProps) => (
	<MessageSystemTimestampFrame className='rcx-message-system__time' {...props} />
);

export default withFuselageProvider(MessageSystemTimestamp);
