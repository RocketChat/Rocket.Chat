import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

/**
 * The conference renders standalone, outside the app's navigation chrome, so it has no `MainContent`
 * ancestor to inherit a height from — this establishes the viewport box the conference fills.
 */
const ConferenceViewport = ({ children }: { children: ReactNode }) => (
	// `100dvh` so a mobile browser's collapsing URL bar doesn't leave the call clipped or scrollable.
	<Box backgroundColor='surface-tint' height='100dvh' width='100%' display='flex' flexDirection='column' overflow='hidden'>
		{children}
	</Box>
);

export default ConferenceViewport;
