import { styled, Text } from '@tamagui/web';
import type { ReactNode } from 'react';

import { textIconColors } from '../../../Theme';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { boxText, truncatedText } from '../messageStyles';

const ThreadMessageBodyFrame = styled(Text, {
	render: 'div',
	display: 'block',
	...boxText,
	...truncatedText,
	flexShrink: 1,
	color: String(textIconColors['font-default']),
});

export type ThreadMessageBodyProps = {
	children?: ReactNode;
};

const ThreadMessageBody = (props: ThreadMessageBodyProps) => <ThreadMessageBodyFrame className='rcx-message-thread__message' {...props} />;

export default withFuselageProvider(ThreadMessageBody);
