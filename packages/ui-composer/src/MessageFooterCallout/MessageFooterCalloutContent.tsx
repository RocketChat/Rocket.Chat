import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import { forwardRef } from 'react';

const MessageFooterCalloutContent = forwardRef<
	HTMLButtonElement,
	{
		children: ReactNode;
	}
>((props, ref): ReactElement => <Box mi='x4' ref={ref} flexWrap='wrap' flexShrink={1} {...props} />);

export default MessageFooterCalloutContent;
