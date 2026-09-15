import { PaletteStyleTag } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ConferenceViewport from './ConferenceViewport';
import { CONFERENCE_THEMED_CLASS } from './panelStyles';

const REFERENCE_TAG_ID = 'reference-palette';

/** The palette Fuselage emits for a theme at `:root`, to compare against the ones this component scopes. */
const paletteFor = (theme: 'light' | 'dark' | 'high-contrast') => {
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

/** The window's own palette, compared at `:root` — the doubled selector is only there to outrank the app's. */
const pinnedCss = () => document.getElementById('conference-palette')?.textContent?.replaceAll(':root:root', ':root');

describe('ConferenceViewport', () => {
	it('renders what it is given', () => {
		renderViewport('light');

		expect(screen.getByText('the call')).toBeInTheDocument();
	});

	// A call surface is dark in every product that has one, and light controls over a black video tile read as a
	// bug. Painted at the document rather than at this box because the window's menus, popovers and modals all
	// portal to the body — a palette scoped to this subtree would leave them light over a dark call.
	it.each(['light', 'dark'] as const)('pins the window dark, whatever the reader prefers (%s)', (themeAppearence) => {
		renderViewport(themeAppearence);

		expect(pinnedCss()).toBe(paletteFor('dark'));
	});

	// Unlike light and dark, high contrast answers a legibility need rather than a taste, so it is the one
	// preference the pin gives way to.
	it('gives way to high contrast', () => {
		renderViewport('high-contrast');

		expect(pinnedCss()).toBe(paletteFor('high-contrast'));
	});

	// And this is what hands the reader's own theme back to the panels beside the call, and only to them. It
	// wins over the pin above by being a class rather than `:root`.
	it.each(['light', 'dark'] as const)('scopes the %s palette to the panels', (themeAppearence) => {
		renderViewport(themeAppearence);

		const css = themedCss(themeAppearence);

		expect(css).toContain(`.${CONFERENCE_THEMED_CLASS}`);
		expect(css?.replace(`.${CONFERENCE_THEMED_CLASS}`, ':root')).toBe(paletteFor(themeAppearence));
	});
});
