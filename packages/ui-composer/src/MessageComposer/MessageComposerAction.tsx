import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

const MessageComposerAction = (props: ComponentProps<typeof IconButton>): ReactElement => (
	<IconButton color='neutral-700' mi='x4' size='x24' small {...props} />
);

export default MessageComposerAction;
