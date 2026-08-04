import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';
import { forwardRef } from 'react';

export type MessageFooterCalloutContentProps = BoxProps;

const MessageFooterCalloutContent = forwardRef<HTMLDivElement, MessageFooterCalloutContentProps>(
	function MessageFooterCalloutContent(props, ref) {
		return <Box marginInline={4} ref={ref} flexWrap='wrap' textAlign='center' color='default' flexGrow={1} flexShrink={1} {...props} />;
	},
);

export default MessageFooterCalloutContent;
