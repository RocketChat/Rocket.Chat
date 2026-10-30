import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type LabelWithTagProps = {
	children: ReactNode;
};

/**
 * A field label's text followed by the tags that qualify it, such as Premium or No permission.
 */
const LabelWithTag = ({ children }: LabelWithTagProps) => (
	<Box is='span' display='flex' gap='x4' paddingInlineEnd='x4'>
		{children}
	</Box>
);

export default LabelWithTag;
