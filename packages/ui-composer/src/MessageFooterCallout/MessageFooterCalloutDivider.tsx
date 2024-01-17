import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { forwardRef } from 'react';

const MessageFooterCalloutDivider = forwardRef<HTMLButtonElement>(function MessageFooterCalloutDivider(props, ref): ReactElement {
	return <Box is='hr' ref={ref} borderInlineStart='1px solid' mi={4} flexShrink={0} {...props} />;
});

export default MessageFooterCalloutDivider;
