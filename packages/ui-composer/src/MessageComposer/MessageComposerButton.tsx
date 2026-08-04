import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type MessageComposerButtonProps = ComponentProps<typeof Button>;

const MessageComposerButton = (props: MessageComposerButtonProps) => <Button small {...props} />;

export default MessageComposerButton;
