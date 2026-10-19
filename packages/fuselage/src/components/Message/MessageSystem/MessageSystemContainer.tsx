import { styled, View } from '@tamagui/web';
import type { ReactNode } from 'react';

import { size, spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { boxText, truncatedText } from '../messageStyles';

const MessageSystemContainerFrame = styled(View, {
	render: 'div',
	...boxText,
	...truncatedText,
	flexShrink: 1,
	alignSelf: 'center',
	width: size('full'),
	marginBlock: spacing('neg-x4'),
});

export type MessageSystemContainerProps = {
	children?: ReactNode;
};

const MessageSystemContainer = (props: MessageSystemContainerProps) => (
	<MessageSystemContainerFrame className='rcx-message-system__container' {...props} />
);

export default withFuselageProvider(MessageSystemContainer);
