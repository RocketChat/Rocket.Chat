import { composeStories } from '@storybook/react';

import * as stories from './Divider.stories.js';
import { render } from '../../testing.js';

const { Default } = composeStories(stories);

describe('[Divider Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});
});
