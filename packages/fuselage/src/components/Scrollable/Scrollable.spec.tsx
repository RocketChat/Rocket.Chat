import { screen } from '@testing-library/react';

import Scrollable from './Scrollable';
import { render } from '../../testing';
import { Box } from '../Box';

describe('Scrollabe Component', () => {
	it('makes its child scrollable', () => {
		render(
			<Scrollable>
				<Box data-testid='content' />
			</Scrollable>,
		);

		expect(screen.getByTestId('content')).toHaveStyle({ overflow: 'auto' });
	});
});
