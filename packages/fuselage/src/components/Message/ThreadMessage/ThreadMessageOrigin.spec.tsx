import { screen } from '@testing-library/react';

import ThreadMessageOrigin from './ThreadMessageOrigin.js';
import { render } from '../../../testing.js';

describe('ThreadMessageOrigin', () => {
	it('renders without crashing', () => {
		render(<ThreadMessageOrigin />);
	});

	it('should render system variation', () => {
		render(<ThreadMessageOrigin system>system</ThreadMessageOrigin>);

		expect(screen.getByText('system')).toHaveClass('rcx-message-thread__origin--system');
	});
});
