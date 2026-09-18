import { Box, PaletteStyleTag } from '@rocket.chat/fuselage';
import { ModalProviderWithRegion, useThemeMode } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';

import { CONFERENCE_THEMED_CLASS } from '../lib/panelStyles';

/**
 * The box the conference window fills, since it is a window of its own and has no ancestor to take a height
 * from. It also carries the window's palette and its own modal region — see
 * [docs/features/video-conference.md](../../../../docs/features/video-conference.md).
 */
const ConferenceViewport = ({ children }: { children: ReactNode }) => {
	const theme = useThemeMode();

	return (
		// `100dvh` so a mobile browser's collapsing URL bar doesn't leave the call clipped or scrollable.
		<Box backgroundColor='surface-tint' height='100dvh' width='100%' display='flex' flexDirection='column' overflow='hidden'>
			{/* `:root:root` rather than `:root`: same element, one specificity step above the app's own palette
			    tag, so this wins while it is mounted without depending on which tag the head happens to hold
			    last. */}
			<PaletteStyleTag theme={theme === 'high-contrast' ? 'high-contrast' : 'dark'} selector=':root:root' tagId='conference-palette' />
			<PaletteStyleTag theme={theme} selector={`.${CONFERENCE_THEMED_CLASS}`} tagId={`conference-themed-palette-${theme}`} />
			<ModalProviderWithRegion>{children}</ModalProviderWithRegion>
		</Box>
	);
};

export default ConferenceViewport;
