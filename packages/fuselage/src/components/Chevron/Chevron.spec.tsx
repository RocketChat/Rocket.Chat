import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';

import * as stories from './Chevron.stories.js';
import { render } from '../../testing.js';

const { Default } = composeStories(stories);

describe('[Chevron Component]', () => {
	it('renders without crashing', () => {
		render(<Default data-testid='chevron' />);
		expect(screen.getByTestId('chevron')).toHaveClass('rcx-chevron');
	});
});
