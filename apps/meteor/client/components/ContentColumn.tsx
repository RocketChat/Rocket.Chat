import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ContentColumnProps = {
	/** `form` for forms and settings, `wide` for reading content such as an app's details. */
	size?: 'form' | 'wide';
	children: ReactNode;
};

const maxWidths = {
	form: 'x600',
	wide: 'x640',
} as const;

/**
 * The centred, width-capped column a page's or a tab's content sits in.
 */
const ContentColumn = ({ size = 'form', children }: ContentColumnProps) => (
	<Box width='full' maxWidth={maxWidths[size]} marginInline='auto'>
		{children}
	</Box>
);

export default ContentColumn;
