import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes, ReactElement } from 'react';
import { forwardRef } from 'react';

const MessageComposerInput = forwardRef<HTMLTextAreaElement, AllHTMLAttributes<HTMLTextAreaElement>>(
	(props, ref): ReactElement => (
		<Box pb='x8' pi='x16' display='flex'>
			<Box {...({ is: 'textarea' } as any)} resize='none' fontScale='p2' rows='1' ref={ref} {...props} borderWidth={0} flexGrow={1} />
		</Box>
	),
);

export default MessageComposerInput;
