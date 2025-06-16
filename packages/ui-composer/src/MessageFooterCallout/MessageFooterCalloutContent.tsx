import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

type MessageFooterCalloutContentProps = ComponentProps<typeof Box>;

const MessageFooterCalloutContent = forwardRef<HTMLDivElement, MessageFooterCalloutContentProps>(
	function MessageFooterCalloutContent(props, ref) {
		return <Box mi={4} ref={ref} flexWrap='wrap' textAlign='center' color='default' flexGrow={1} flexShrink={1} {...props} />;
	},
);

export default MessageFooterCalloutContent;
