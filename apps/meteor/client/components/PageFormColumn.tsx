import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type PageFormColumnProps = {
	children: ReactNode;
};

/**
 * The centred, form-width column that holds a page's form or settings inside its scrollable content.
 */
const PageFormColumn = ({ children }: PageFormColumnProps) => (
	<Box maxWidth='x600' width='full' alignSelf='center'>
		{children}
	</Box>
);

export default PageFormColumn;
