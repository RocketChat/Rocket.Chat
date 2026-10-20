import { styled, type GetProps } from '@tamagui/web';

import MessageContainer from './MessageContainer';

const MessageLeftContainer = styled(MessageContainer, {
	className: 'rcx-message-container rcx-message-container--left',
	displayName: 'MessageLeftContainer',
	left: true,
});

export type MessageLeftContainerProps = GetProps<typeof MessageLeftContainer>;

export default MessageLeftContainer;
