import type { HTMLAttributes } from 'react';

import { MessageContainerBase } from './MessageContainer';
import { markStaticComponent } from '../FuselageProvider/FuselageProvider';

export type MessageContainerFixedProps = HTMLAttributes<HTMLDivElement>;

const MessageContainerFixed = (props: MessageContainerFixedProps) => (
	<MessageContainerBase fixed rcxClassName='rcx-message-container rcx-message-container--fixed' {...props} />
);

export default markStaticComponent(MessageContainerFixed);
