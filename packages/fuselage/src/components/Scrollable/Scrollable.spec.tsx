import { screen } from '@testing-library/react';

import Scrollable from './Scrollable.js';
import { render } from '../../testing.js';
import { Box } from '../Box/index.js';

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
