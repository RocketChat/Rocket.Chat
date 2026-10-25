import { Box, Button } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

export type MessageFooterCalloutActionProps = ComponentProps<typeof Button>;

const MessageFooterCalloutAction = forwardRef<HTMLButtonElement, MessageFooterCalloutActionProps>(
	function MessageFooterCalloutAction(props, ref) {
		return (
			<Box display='flex' flexShrink={0}>
				<Button ref={ref} primary small {...props} />
			</Box>
		);
	},
);

export default MessageFooterCalloutAction;
