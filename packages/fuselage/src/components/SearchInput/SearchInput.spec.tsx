import { composeStories } from '@storybook/react-vite';
import { axe } from 'jest-axe';

import * as stories from './SearchInput.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[SearchInput Component]', () => {
	it('%s should have no a11y violations', async () => {
		const { container } = render(<Default />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
