import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const MessageComposerButton = (props: ComponentProps<typeof Button>) => <Button small {...props} />;

export default MessageComposerButton;
