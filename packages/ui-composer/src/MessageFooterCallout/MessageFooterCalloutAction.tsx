import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface MessageFooterCalloutActionProps extends ComponentProps<typeof Button> {}

const MessageFooterCalloutAction = forwardRef<HTMLButtonElement, MessageFooterCalloutActionProps>(
	function MessageFooterCalloutAction(props, ref) {
		return <Button mi={4} ref={ref} primary small flexShrink={0} {...props} />;
	},
);

export default MessageFooterCalloutAction;
