import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

const MessageComposerButton = (props: ComponentProps<typeof Button>): ReactElement => <Button small {...props} />;

export default MessageComposerButton;
