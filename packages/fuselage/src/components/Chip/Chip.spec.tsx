import { composeStories } from '@storybook/react-webpack5';

import * as stories from './Chip.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Chevron Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});
});
