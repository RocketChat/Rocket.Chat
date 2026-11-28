import { screen } from '@testing-library/react';

import Tile from './Tile';
import { render } from '../../testing';

describe('[Tile Component]', () => {
	it('renders its content at the default elevation', () => {
		render(<Tile>Content</Tile>);

		expect(screen.getByText('Content')).toHaveClass('rcx-tile', 'rcx-tile--elevation-1');
	});
});
