import { Box } from '@rocket.chat/fuselage';
import type { RefAttributes } from 'react';

export type MessageFooterCalloutDividerProps = RefAttributes<HTMLButtonElement>;

const MessageFooterCalloutDivider = ({ ref, ...props }: MessageFooterCalloutDividerProps) => (
	<Box is='hr' ref={ref} borderInlineStart='1px solid' marginInline={4} flexShrink={0} {...props} />
);

export default MessageFooterCalloutDivider;
