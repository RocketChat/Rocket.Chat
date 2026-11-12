import { composeStories } from '@storybook/react';

import * as stories from './Throbber.stories.js';
import { render } from '../../testing.js';

const { Default } = composeStories(stories);

describe('[Throbber Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});
});
