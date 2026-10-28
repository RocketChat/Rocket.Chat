import { composeStories } from '@storybook/react-vite';

import * as stories from './Throbber.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Throbber Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});
});
