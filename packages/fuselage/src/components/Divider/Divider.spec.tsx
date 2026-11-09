import { composeStories } from '@storybook/react';

import * as stories from './Divider.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Divider Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});
});
