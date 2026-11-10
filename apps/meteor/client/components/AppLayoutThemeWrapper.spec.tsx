import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, queryAllByAttribute } from '@testing-library/react';

import AppLayoutThemeWrapper from './AppLayoutThemeWrapper';

describe('AppLayoutThemeWrapper', () => {
	it.each([
		['dark', 'dark'],
		['light', 'only light'],
		['high-contrast', 'only light'],
	])('should declare the color scheme of the %s theme once', (themeAppearence, colorScheme) => {
		const { unmount } = render(<AppLayoutThemeWrapper>content</AppLayoutThemeWrapper>, {
			wrapper: mockAppRoot().withUserPreference('themeAppearence', themeAppearence).build(),
		});
		const metas = queryAllByAttribute('name', document.head, 'color-scheme');
		expect(metas).toHaveLength(1);
		expect(metas[0]).toHaveAttribute('content', colorScheme);
		unmount();
	});
});
