import { PaletteStyleTag } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ConferenceViewport from './ConferenceViewport';
import { CONFERENCE_THEMED_CLASS } from '../lib/panelStyles';

/** The palette custom properties an element resolves. jsdom does not inherit them, so this is what its own rules set. */
const paletteOf = (element: Element) => {
	const style = getComputedStyle(element);
	return Object.fromEntries(
		Array.from(style)
			.filter((name) => name.startsWith('--rcx-'))
			.map((name) => [name, style.getPropertyValue(name)]),
	);
};

/** The palette Fuselage emits for a theme, to compare against the ones this component applies. */
const paletteFor = (theme: 'light' | 'dark' | 'high-contrast') => {
	const { unmount } = render(
		<>
			<PaletteStyleTag theme={theme} selector='.reference' tagId='reference-palette' />
			<div className='reference'>reference</div>
		</>,
	);
	const palette = paletteOf(screen.getByText('reference'));
	unmount();
	return palette;
};

const renderViewport = (themeAppearence: string) =>
	render(
		<ConferenceViewport>
			the call
			<div className={CONFERENCE_THEMED_CLASS}>a panel</div>
		</ConferenceViewport>,
		{
			wrapper: mockAppRoot().withUserPreference('themeAppearence', themeAppearence).build(),
		},
	);

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

		expect(paletteOf(document.documentElement)).toEqual(paletteFor('dark'));
	});

	// Unlike light and dark, high contrast answers a legibility need rather than a taste, so it is the one
	// preference the pin gives way to.
	it('gives way to high contrast', () => {
		renderViewport('high-contrast');

		expect(paletteOf(document.documentElement)).toEqual(paletteFor('high-contrast'));
	});

	// And this is what hands the reader's own theme back to the panels beside the call, and only to them. It
	// wins over the pin above by being a class rather than `:root`.
	it.each(['light', 'dark'] as const)('scopes the %s palette to the panels', (themeAppearence) => {
		renderViewport(themeAppearence);

		expect(paletteOf(screen.getByText('a panel'))).toEqual(paletteFor(themeAppearence));
	});
});
