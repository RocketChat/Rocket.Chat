import { screen } from '@testing-library/react';

import Margins from './Margins.js';
import { render } from '../../testing.js';
import { Box } from '../Box/index.js';

describe('[Margins Component]', () => {
	it('renders without crashing', () => {
		render(
			<Margins all='x8'>
				<Box>Content</Box>
			</Margins>,
		);
		expect(screen.getByText('Content')).toHaveStyle({ margin: '8px' });
	});

	it('patches non-`Box` children', () => {
		render(
			<Margins all='x8'>
				<div>Content</div>
			</Margins>,
		);

		expect(screen.getByText('Content')).toHaveCssInJsClass();
	});
});
