import { screen } from '@testing-library/react';

import Margins from './Margins';
import { render } from '../../testing';
import { Box } from '../Box';

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


	it('applies a zero margin to non-`Box` children', () => {
		const { container } = render(
			<Margins all={0}>
				<div />
			</Margins>,
		);

		expect(container.firstElementChild).toHaveCssInJsClass();
		expect(container.firstElementChild).toHaveStyle({ margin: '0px' });
	});
});
