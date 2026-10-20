import { styled, type GetProps } from '@tamagui/web';

import MessageContainer from './MessageContainer';

const MessageContainerFixed = styled(MessageContainer, {
	className: 'rcx-message-container rcx-message-container--fixed',
	displayName: 'MessageContainerFixed',
	fixed: true,
});

export type MessageContainerFixedProps = GetProps<typeof MessageContainerFixed>;

export default MessageContainerFixed;
