import { screen } from '@testing-library/react';

import States from './States';
import { render } from '../../testing';

describe('[States Component]', () => {
	it('renders its content in the states container', () => {
		render(<States>No results</States>);

		expect(screen.getByText('No results')).toHaveClass('rcx-states');
	});
});
