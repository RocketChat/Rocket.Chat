import { screen } from '@testing-library/react';

import ThreadMessageOrigin from './ThreadMessageOrigin';
import { render } from '../../../testing';

describe('ThreadMessageOrigin', () => {
	it('should render without the system variation by default', () => {
		render(<ThreadMessageOrigin>origin</ThreadMessageOrigin>);

		expect(screen.getByText('origin')).not.toHaveClass('rcx-message-thread__origin--system');
	});

	it('should render system variation', () => {
		render(<ThreadMessageOrigin system>system</ThreadMessageOrigin>);

		expect(screen.getByText('system')).toHaveClass('rcx-message-thread__origin--system');
	});
});
