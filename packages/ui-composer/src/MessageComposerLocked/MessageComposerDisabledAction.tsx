import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import { forwardRef } from 'react';

const MessageComposerDisabledAction = forwardRef<HTMLButtonElement, ComponentProps<typeof Button>>(
	(props, ref): ReactElement => <Button ref={ref} primary small mis='x8' flexShrink={0} {...props} />,
);

export default MessageComposerDisabledAction;
