import { Button } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

export type MessageFooterCalloutActionProps = ComponentProps<typeof Button>;

const MessageFooterCalloutAction = forwardRef<HTMLButtonElement, MessageFooterCalloutActionProps>(
	function MessageFooterCalloutAction(props, ref) {
		return <Button marginInline={4} ref={ref} primary small flexShrink={0} {...props} />;
	},
);

export default MessageFooterCalloutAction;
