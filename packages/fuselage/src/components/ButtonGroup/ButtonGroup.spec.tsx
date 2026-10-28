import { composeStories } from '@storybook/react-vite';
import { axe } from 'jest-axe';

import * as stories from './ButtonGroup.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[ButtonGroup Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});

	it('should have no a11y violations', async () => {
		const { container } = render(<Default />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
