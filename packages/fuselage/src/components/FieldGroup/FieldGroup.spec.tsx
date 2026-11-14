import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';

import * as stories from './FieldGroup.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[FieldGroup Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
		expect(screen.getByText('Field #1')).toBeInTheDocument();
	});
});
