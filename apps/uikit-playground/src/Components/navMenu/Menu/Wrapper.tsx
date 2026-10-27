import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type WrapperProps = { children: ReactNode };

const Wrapper = ({ children }: WrapperProps) => (
	<Box
		paddingBlockStart='80px'
		paddingInlineStart='50px'
		display='inline-flex'
		flexDirection='column'
		alignItems='center'
		justifyContent='space-between'
		verticalAlign='middle'
		height='max-content'
		width='100%'
	>
		{children}
	</Box>
);

export default Wrapper;
