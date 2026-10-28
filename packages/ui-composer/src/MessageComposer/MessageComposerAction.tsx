import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const MessageComposerAction = (props: ComponentProps<typeof IconButton>) => <IconButton size='small' {...props} />;

export default MessageComposerAction;
