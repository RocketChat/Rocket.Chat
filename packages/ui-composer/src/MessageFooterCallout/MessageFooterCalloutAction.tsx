import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import { forwardRef } from 'react';

const MessageFooterCalloutAction = forwardRef<HTMLButtonElement, ComponentProps<typeof Button>>(
	(props, ref): ReactElement => <Button mi='x4' ref={ref} primary small flexShrink={0} {...props} />,
);

export default MessageFooterCalloutAction;
