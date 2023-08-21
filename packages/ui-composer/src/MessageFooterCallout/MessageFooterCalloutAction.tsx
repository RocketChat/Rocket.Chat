import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import { forwardRef } from 'react';

const MessageFooterCalloutAction = forwardRef<HTMLButtonElement, ComponentProps<typeof Button>>(function MessageFooterCalloutAction(
	props,
	ref,
): ReactElement {
	const modifiedProps = props.danger ? { ...props, primary: false } : props;
	return <Button mi={4} ref={ref} primary small flexShrink={0} {...modifiedProps} />;
});

export default MessageFooterCalloutAction;
