import { PaletteStyleTag } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ConferenceViewport from './ConferenceViewport';
import { CONFERENCE_THEMED_CLASS } from './panelStyles';

const REFERENCE_TAG_ID = 'reference-palette';

/** The palette Fuselage emits for a theme at `:root`, to compare against the one scoped to the panel class. */
const paletteFor = (theme: 'light' | 'dark') => {
	const { unmount } = render(<PaletteStyleTag theme={theme} tagId={REFERENCE_TAG_ID} />);
	const css = document.getElementById(REFERENCE_TAG_ID)?.textContent;
	unmount();
	return css;
};

const renderViewport = (themeAppearence: string) =>
	render(<ConferenceViewport>the call</ConferenceViewport>, {
		wrapper: mockAppRoot().withUserPreference('themeAppearence', themeAppearence).build(),
	});

const themedCss = (theme: string) => document.getElementById(`conference-themed-palette-${theme}`)?.textContent;

describe('ConferenceViewport', () => {
	it('renders what it is given', () => {
		renderViewport('light');

		expect(screen.getByText('the call')).toBeInTheDocument();
	});

	// The window itself is pinned dark by its route; this is what hands the reader's own theme back to the
	// panels beside the call, and only to them.
	it.each(['light', 'dark'] as const)('scopes the %s palette to the panels', (themeAppearence) => {
		renderViewport(themeAppearence);

		const css = themedCss(themeAppearence);

		expect(css).toContain(`.${CONFERENCE_THEMED_CLASS}`);
		expect(css?.replace(`.${CONFERENCE_THEMED_CLASS}`, ':root')).toBe(paletteFor(themeAppearence));
	});
});
