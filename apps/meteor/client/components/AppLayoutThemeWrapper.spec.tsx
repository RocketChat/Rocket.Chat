import { PaletteStyleTag } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';

import AppLayoutThemeWrapper from './AppLayoutThemeWrapper';

const APP_TAG_ID = 'app-layout-palette';
const REFERENCE_TAG_ID = 'reference-palette';

const cssOf = (tagId: string) => document.getElementById(tagId)?.textContent;

/** The palette Fuselage itself emits for a theme, so the assertions below aren't a copy of its colour values. */
const paletteFor = (theme: 'light' | 'dark' | 'high-contrast') => {
	const { unmount } = render(<PaletteStyleTag theme={theme} tagId={REFERENCE_TAG_ID} />);
	const css = cssOf(REFERENCE_TAG_ID);
	unmount();
	return css;
};

const renderWrapper = (themeAppearence: string, theme?: 'dark') =>
	render(<AppLayoutThemeWrapper theme={theme}>{null}</AppLayoutThemeWrapper>, {
		wrapper: mockAppRoot().withUserPreference('themeAppearence', themeAppearence).build(),
	});

describe('AppLayoutThemeWrapper', () => {
	it('pins the palette it is given, whatever the reader prefers', () => {
		renderWrapper('light', 'dark');

		expect(cssOf(APP_TAG_ID)).toBe(paletteFor('dark'));
	});

	// The conference window pins dark because a call surface is dark. High contrast is not a look but a
	// legibility need, so it is the one preference the pin gives way to.
	it('gives way to high contrast', () => {
		renderWrapper('high-contrast', 'dark');

		expect(cssOf(APP_TAG_ID)).toBe(paletteFor('high-contrast'));
	});

	// Guards every other route from the change above: left unpinned this still follows the system's dark mode —
	// jsdom reports light — rather than the appearance preference, which is what the app's content palette reads.
	it('follows the system for a layout that pins nothing', () => {
		renderWrapper('dark');

		expect(cssOf(APP_TAG_ID)).toBe(paletteFor('light'));
	});
});
