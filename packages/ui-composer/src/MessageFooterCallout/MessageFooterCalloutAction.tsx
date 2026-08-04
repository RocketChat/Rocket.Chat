import type { ButtonProps } from '@rocket.chat/fuselage';
import { Button } from '@rocket.chat/fuselage';
import { forwardRef } from 'react';

export type MessageFooterCalloutActionProps = ButtonProps;

const MessageFooterCalloutAction = forwardRef<HTMLButtonElement, MessageFooterCalloutActionProps>(
	function MessageFooterCalloutAction(props, ref) {
		return <Button marginInline={4} ref={ref} primary small flexShrink={0} {...props} />;
	},
);

export default MessageFooterCalloutAction;
