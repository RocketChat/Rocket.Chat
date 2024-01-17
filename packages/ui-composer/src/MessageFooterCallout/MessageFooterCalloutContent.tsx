import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import { forwardRef } from 'react';

const MessageFooterCalloutContent = forwardRef<
	HTMLButtonElement,
	{
		children: ReactNode;
	}
>(function MessageFooterCalloutContent(props, ref): ReactElement {
	return <Box mi={4} ref={ref} flexWrap='wrap' textAlign='center' color='default' flexGrow={1} flexShrink={1} {...props} />;
});

export default MessageFooterCalloutContent;
