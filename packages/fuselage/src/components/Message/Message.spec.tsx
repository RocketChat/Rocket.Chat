import { composeStories } from '@storybook/react';

import * as stories from './Messages.stories.js';
import { render } from '../../testing.js';

const { Default } = composeStories(stories);

describe('[Message Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});
});
