import { composeStories } from '@storybook/react-webpack5';

import * as stories from './Throbber.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Throbber Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});
});
