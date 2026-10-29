import { screen } from '@testing-library/react';

import States from './States';
import StatesLink from './StatesLink';
import { render } from '../../testing';

describe('[States Component]', () => {
	it('renders without crashing', () => {
		render(<States />);
	});

	it('renders the link text', () => {
		render(<StatesLink href='#'>Go back</StatesLink>);

		expect(screen.getByRole('link', { name: 'Go back' })).toBeInTheDocument();
	});
});
