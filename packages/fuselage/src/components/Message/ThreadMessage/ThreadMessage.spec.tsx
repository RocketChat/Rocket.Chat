import { screen } from '@testing-library/react';

import ThreadMessage from './ThreadMessage.js';
import { render } from '../../../testing.js';

it('renders without crashing', () => {
	render(<ThreadMessage data-testid='thread' />);
	expect(screen.getByTestId('thread')).toHaveClass('rcx-message-thread');
});
