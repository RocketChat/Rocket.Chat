import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type AppDetailsMetadataProps = {
	children: ReactNode;
};

/**
 * The line of small print under an app's name: author, version, last update, set apart by separators.
 */
const AppDetailsMetadata = ({ children }: AppDetailsMetadataProps) => (
	<Box fontScale='c1' display='flex' flexDirection='row' color='hint' alignItems='center' gap='x16'>
		{children}
	</Box>
);

export default AppDetailsMetadata;
