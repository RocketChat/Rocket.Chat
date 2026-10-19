import { styled, Text, type GetProps } from '@tamagui/web';

import { textIconColors } from '../../../Theme';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import type { MessageNameProps } from '../MessageName';
import { boxText, textScale, truncatedText } from '../messageStyles';

const MessageSystemNameFrame = styled(Text, {
	render: 'span',
	...boxText,
	...textScale('p2b'),
	...truncatedText,
	flexShrink: 0,
	color: String(textIconColors['font-titles-labels']),
});

export type MessageSystemNameProps = MessageNameProps;

const MessageSystemName = (props: MessageSystemNameProps) => (
	<MessageSystemNameFrame className='rcx-message-system__name' {...(props as GetProps<typeof MessageSystemNameFrame>)} />
);

export default withFuselageProvider(MessageSystemName);
