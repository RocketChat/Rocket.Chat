import type { ButtonProps } from '@rocket.chat/fuselage';
import { Button } from '@rocket.chat/fuselage';

export type MessageComposerButtonProps = ButtonProps;

const MessageComposerButton = (props: MessageComposerButtonProps) => <Button small {...props} />;

export default MessageComposerButton;
