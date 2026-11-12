import { composeStories } from '@storybook/react';

import * as stories from './FieldGroup.stories.js';
import { render } from '../../testing.js';

const { Default } = composeStories(stories);

describe('[FieldGroup Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});
});
