import type { ButtonProps } from '@rocket.chat/fuselage';
import { Button } from '@rocket.chat/fuselage';
import type { RefAttributes } from 'react';

export type MessageFooterCalloutActionProps = ButtonProps & RefAttributes<HTMLButtonElement>;

const MessageFooterCalloutAction = ({ ref, ...props }: MessageFooterCalloutActionProps) => (
	<Button marginInline={4} ref={ref} primary small flexShrink={0} {...props} />
);

export default MessageFooterCalloutAction;
