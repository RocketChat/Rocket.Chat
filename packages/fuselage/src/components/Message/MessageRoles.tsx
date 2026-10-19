import { styled, View, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { boxText, truncatedText } from './messageStyles';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const MessageRolesFrame = styled(View, {
	render: 'div',
	...boxText,
	...truncatedText,
	flexDirection: 'row',
	flexShrink: 1,
});

export type MessageRolesProps = HTMLAttributes<HTMLDivElement>;

const MessageRoles = (props: MessageRolesProps) => (
	<MessageRolesFrame className='rcx-message-header__roles' {...(props as GetProps<typeof MessageRolesFrame>)} />
);

export default withFuselageProvider(MessageRoles);
