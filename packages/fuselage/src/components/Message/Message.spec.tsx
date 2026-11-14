import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';

import * as stories from './Messages.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Message Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
		expect(screen.getByText('@haylie.george')).toBeInTheDocument();
	});
});
