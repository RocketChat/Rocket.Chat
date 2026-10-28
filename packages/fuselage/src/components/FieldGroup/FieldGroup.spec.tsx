import { composeStories } from '@storybook/react-vite';

import * as stories from './FieldGroup.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[FieldGroup Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});
});
