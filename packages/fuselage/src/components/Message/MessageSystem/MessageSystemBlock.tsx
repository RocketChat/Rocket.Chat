import { styled, View } from '@tamagui/web';
import type { ReactNode } from 'react';

import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';

const MessageSystemBlockFrame = styled(View, {
	render: 'div',
	flexDirection: 'row',
	alignItems: 'center',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
});

export type MessageSystemBlockProps = {
	children?: ReactNode;
};

const MessageSystemBlock = (props: MessageSystemBlockProps) => <MessageSystemBlockFrame className='rcx-message-system__block' {...props} />;

export default withFuselageProvider(MessageSystemBlock);
