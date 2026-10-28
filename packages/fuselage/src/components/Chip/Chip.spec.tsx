import { composeStories } from '@storybook/react-vite';

import * as stories from './Chip.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Chevron Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});
});
