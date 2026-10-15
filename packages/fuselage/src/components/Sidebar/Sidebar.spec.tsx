import { composeStories } from '@storybook/react-webpack5';
import { axe } from 'jest-axe';

import * as stories from './Sidebar.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Sidebar Default story]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});
	it('should have no a11y violations', async () => {
		const { container } = render(<Default />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
