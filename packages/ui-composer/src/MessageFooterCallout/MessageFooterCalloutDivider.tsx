import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { forwardRef } from 'react';

const MessageFooterCalloutDivider = forwardRef<HTMLButtonElement>(
	(props, ref): ReactElement => <Box is='hr' ref={ref} borderInlineStart='1px solid' mi='x4' flexShrink={0} {...props} />,
);

export default MessageFooterCalloutDivider;
