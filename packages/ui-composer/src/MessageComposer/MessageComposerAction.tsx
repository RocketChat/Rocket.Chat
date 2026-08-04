import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type MessageComposerActionProps = ComponentProps<typeof IconButton>;

const MessageComposerAction = (props: MessageComposerActionProps) => <IconButton small {...props} />;

export default MessageComposerAction;
