import { styled, Text, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { boxText, textScale, truncatedText } from './messageStyles';
import { textIconColors } from '../../Theme';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const MessageUsernameFrame = styled(Text, {
	render: 'span',
	...boxText,
	...textScale('p2'),
	...truncatedText,
	flexShrink: 1,
	color: String(textIconColors['font-default']),
});

export type MessageUsernameProps = HTMLAttributes<HTMLSpanElement>;

const MessageUsername = (props: MessageUsernameProps) => (
	<MessageUsernameFrame className='rcx-message-header__username' {...(props as GetProps<typeof MessageUsernameFrame>)} />
);

export default withFuselageProvider(MessageUsername);
