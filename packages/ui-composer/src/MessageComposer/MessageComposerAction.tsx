import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

const MessageComposerAction = (props: ComponentProps<typeof IconButton>): ReactElement => <IconButton small {...props} />;

export default MessageComposerAction;
