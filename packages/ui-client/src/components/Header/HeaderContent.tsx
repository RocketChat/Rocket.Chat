import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type HeaderContentProps = { children?: ReactNode };

const HeaderContent = ({ children }: HeaderContentProps) => (
	<Box flexGrow={1} width={1} flexShrink={1} marginInline={4} display='flex' justifyContent='center' flexDirection='column'>
		{children}
	</Box>
);

export default HeaderContent;
