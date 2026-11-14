import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';

import * as stories from './Throbber.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Throbber Component]', () => {
	it('renders without crashing', () => {
		render(<Default data-testid='throbber' />);

		expect(screen.getByTestId('throbber')).toHaveClass('rcx-throbber');
	});
});
