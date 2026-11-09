import { composeStories } from '@storybook/react';
import { axe } from 'jest-axe';

import * as stories from './UrlInput.stories.js';
import { render } from '../../testing.js';

const { Default } = composeStories(stories);

describe('[UrlInput Component]', () => {
	it('%s should have no a11y violations', async () => {
		const { container } = render(<Default />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
