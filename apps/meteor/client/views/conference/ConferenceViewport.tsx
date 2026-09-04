import { Box, PaletteStyleTag } from '@rocket.chat/fuselage';
import { useThemeMode } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';

import { CONFERENCE_THEMED_CLASS } from './panelStyles';

/**
 * The conference renders standalone, outside the app's navigation chrome, so it has no `MainContent`
 * ancestor to inherit a height from — this establishes the viewport box the conference fills.
 *
 * It also carries the window's one palette exception. The window is pinned dark at the root (see the route's
 * `theme`), which is what the call wants and what anything portalled out of it — a device picker, a menu over a
 * video tile — inherits by landing in the same document. `CONFERENCE_THEMED_CLASS` hands the reader's
 * preference back to the subtrees that ask for it, so a chat beside the call is read in the theme its room is
 * read in everywhere else.
 */
const ConferenceViewport = ({ children }: { children: ReactNode }) => {
	const theme = useThemeMode();

	return (
		// `100dvh` so a mobile browser's collapsing URL bar doesn't leave the call clipped or scrollable.
		<Box backgroundColor='surface-tint' height='100dvh' width='100%' display='flex' flexDirection='column' overflow='hidden'>
			<PaletteStyleTag theme={theme} selector={`.${CONFERENCE_THEMED_CLASS}`} tagId={`conference-themed-palette-${theme}`} />
			{children}
		</Box>
	);
};

export default ConferenceViewport;
