import type { HTMLAttributes } from 'react';

import { MessageContainerBase } from './MessageContainer';
import { markStaticComponent } from '../FuselageProvider/FuselageProvider';

export type MessageLeftContainerProps = HTMLAttributes<HTMLDivElement>;

const MessageLeftContainer = (props: MessageLeftContainerProps) => (
	<MessageContainerBase left rcxClassName='rcx-message-container rcx-message-container--left' {...props} />
);

export default markStaticComponent(MessageLeftContainer);
