import { Box, PaletteStyleTag } from '@rocket.chat/fuselage';
import { ModalProviderWithRegion, useThemeMode } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';

import { CONFERENCE_THEMED_CLASS } from './panelStyles';

/**
 * The conference is a window of its own rather than a page inside the workspace, so it cannot rely on an
 * ancestor for its height — this establishes the viewport box it fills.
 *
 * It also carries the window's palette, which is two style tags and no change to anything outside this file.
 *
 * The first pins the document dark while the conference is mounted, the way `ImageGallery` pins itself: a call
 * surface is dark in every product that has one, and light controls over a black video tile read as a bug
 * rather than as a light theme. It paints the document rather than this subtree because half of the window's
 * controls aren't in this subtree — every menu, popover and modal portals to `document.body`, and a scoped
 * palette would leave them in the reader's theme, over a dark call. High contrast outranks the pin: unlike
 * light and dark it answers a legibility need rather than a taste.
 *
 * The second hands the reader's preference back to the subtrees that ask for it by class, so a chat beside the
 * call is read in the theme its room is read in everywhere else. It wins over the first by specificity, being a
 * class rather than `:root`.
 *
 * And it carries the conference's own modal region. `useSetModal` renders into the nearest region, and the
 * app's is mounted at the app root — outside this tree, where a modal of ours would be cut off from the
 * providers it was written under. A region here keeps a modal inside the conference's React tree while the DOM
 * still goes through the modal portal, the same arrangement the voip popout window uses.
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
