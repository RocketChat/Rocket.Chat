import type { IconButtonProps } from '@rocket.chat/fuselage';
import { IconButton } from '@rocket.chat/fuselage';

export type MessageComposerActionProps = IconButtonProps;

const MessageComposerAction = (props: MessageComposerActionProps) => <IconButton small {...props} />;

export default MessageComposerAction;
