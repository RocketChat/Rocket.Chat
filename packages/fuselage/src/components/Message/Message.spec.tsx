import { composeStories } from '@storybook/react-vite';

import * as stories from './Messages.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Message Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});
});
