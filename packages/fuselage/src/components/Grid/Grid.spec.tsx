import { screen } from '@testing-library/react';

import { Grid } from '.';
import { render } from '../../testing';

describe('[Grid Component]', () => {
	it('renders Grid without crashing', () => {
		render(<Grid>Content</Grid>);
		expect(screen.getByText('Content')).toHaveClass('rcx-grid');
	});

	it('renders Grid.Item without crashing', () => {
		render(<Grid.Item>Content</Grid.Item>);
		expect(screen.getByText('Content')).toHaveClass('rcx-grid__item');
	});
});
