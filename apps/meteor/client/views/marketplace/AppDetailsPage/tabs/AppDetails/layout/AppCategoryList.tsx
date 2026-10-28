import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppCategoryListProps = {
	children: ReactNode;
};

/**
 * The wrapping row of chips naming an app's categories.
 */
const AppCategoryList = ({ children }: AppCategoryListProps) => (
	<Box display='flex' flexDirection='row' flexWrap='wrap' justifyContent='start' alignItems='center' gap='x8' padding='x4'>
		{children}
	</Box>
);

export default AppCategoryList;
