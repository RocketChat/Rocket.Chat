import { styled, Text, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { boxText, textScale, truncatedText } from './messageStyles';
import { textIconColors } from '../../Theme';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const MessageNameFrame = styled(Text, {
	render: 'span',
	...boxText,
	...textScale('h5'),
	...truncatedText,
	flexShrink: 1,
	color: String(textIconColors['font-titles-labels']),
});

export type MessageNameProps = HTMLAttributes<HTMLSpanElement>;

const MessageName = (props: MessageNameProps) => (
	<MessageNameFrame className='rcx-message-header__name' {...(props as GetProps<typeof MessageNameFrame>)} />
);

export default withFuselageProvider(MessageName);
