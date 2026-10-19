import { styled, View } from '@tamagui/web';
import type { ReactNode } from 'react';

import { size, spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { boxText, truncatedText } from '../messageStyles';

const ThreadMessageContainerFrame = styled(View, {
	render: 'div',
	...boxText,
	...truncatedText,
	flexDirection: 'row',
	flexShrink: 1,
	width: size('full'),
	margin: spacing('x4'),
});

export type ThreadMessageContainerProps = {
	children?: ReactNode;
};

const ThreadMessageContainer = (props: ThreadMessageContainerProps) => (
	<ThreadMessageContainerFrame className='rcx-message-thread__container' {...props} />
);

export default withFuselageProvider(ThreadMessageContainer);
