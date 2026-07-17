import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type HeaderContentRowProps = { children?: ReactNode };

const HeaderContentRow = ({ children }: HeaderContentRowProps) => (
	<Box alignItems='center' flexShrink={1} flexGrow={1} display='flex' width='full'>
		{children}
	</Box>
);

export default HeaderContentRow;
