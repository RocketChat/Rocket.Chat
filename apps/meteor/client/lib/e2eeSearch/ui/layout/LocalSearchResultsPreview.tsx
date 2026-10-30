import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type LocalSearchResultsPreviewProps = { children: ReactNode };

const LocalSearchResultsPreview = ({ children }: LocalSearchResultsPreviewProps) => (
	<Box display='flex' flexDirection='column' width='x400' height='x600' role='region' aria-label='Search preview'>
		<button type='button'>Before results</button>
		{children}
		<button type='button'>After results</button>
	</Box>
);

export default LocalSearchResultsPreview;
