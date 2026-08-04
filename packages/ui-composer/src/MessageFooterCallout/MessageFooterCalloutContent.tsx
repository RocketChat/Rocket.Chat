import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';
import type { RefAttributes } from 'react';

export type MessageFooterCalloutContentProps = BoxProps & RefAttributes<HTMLDivElement>;

const MessageFooterCalloutContent = ({ ref, ...props }: MessageFooterCalloutContentProps) => (
	<Box marginInline={4} ref={ref} flexWrap='wrap' textAlign='center' color='default' flexGrow={1} flexShrink={1} {...props} />
);

export default MessageFooterCalloutContent;
