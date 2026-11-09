import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';

import * as stories from './Divider.stories.js';
import { render } from '../../testing.js';

const { Default } = composeStories(stories);

describe('[Divider Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
		expect(screen.getByRole('separator')).toHaveClass('rcx-divider');
	});
});
