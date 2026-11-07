import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, queryByAttribute } from '@testing-library/react';

import { MainLayoutStyleTags } from './MainLayoutStyleTags';

describe('MainLayout style tags', () => {
	it('should create the Light theme style tag', () => {
		render(<MainLayoutStyleTags />, {
			wrapper: mockAppRoot().withUserPreference('themeAppearence', 'light').build(),
		});
		const tagLight = queryByAttribute('id', document.head, 'main-palette-light');
		expect(tagLight).not.toBeNull();
	});

	it('should create the Dark theme style tag', () => {
		render(<MainLayoutStyleTags />, {
			wrapper: mockAppRoot().withUserPreference('themeAppearence', 'dark').build(),
		});
		const tagDark = queryByAttribute('id', document.head, 'main-palette-dark');
		expect(tagDark).not.toBeNull();
	});

	it('should create the codeBlock style tag when in dark mode', () => {
		render(<MainLayoutStyleTags />, {
			wrapper: mockAppRoot().withUserPreference('themeAppearence', 'dark').build(),
		});
		const style = queryByAttribute('id', document.head, 'codeBlock-palette');
		expect(style).not.toBeNull();
	});

	it.each([
		['dark', 'dark'],
		['light', 'only light'],
		['high-contrast', 'only light'],
	])('should declare the color scheme of the %s theme', (themeAppearence, colorScheme) => {
		const { unmount } = render(<MainLayoutStyleTags />, {
			wrapper: mockAppRoot().withUserPreference('themeAppearence', themeAppearence).build(),
		});
		expect(queryByAttribute('name', document.head, 'color-scheme')).toHaveAttribute('content', colorScheme);
		unmount();
	});
});

it('should create the Dark theme style tag', () => {
	render(<MainLayoutStyleTags />, {
		wrapper: mockAppRoot().withUserPreference('themeAppearence', 'dark').build(),
	});
	const tagDark = queryByAttribute('id', document.head, 'main-palette-dark');
	expect(tagDark).not.toBeNull();
});

it('should create the codeBlock style tag when in dark mode', () => {
	render(<MainLayoutStyleTags />, {
		wrapper: mockAppRoot().withUserPreference('themeAppearence', 'dark').build(),
	});
	const style = queryByAttribute('id', document.head, 'codeBlock-palette');
	expect(style).not.toBeNull();
});
