import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import { forwardRef } from 'react';

const MessageComposerAction = forwardRef<HTMLDivElement, ComponentProps<typeof IconButton>>(
	(props, ref): ReactElement => <IconButton ref={ref} small {...props} />,
);

export default MessageComposerAction;
