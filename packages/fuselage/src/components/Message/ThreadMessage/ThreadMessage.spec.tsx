import { screen } from '@testing-library/react';

import ThreadMessage from './ThreadMessage';
import { render } from '../../../testing';

it('renders without crashing', () => {
	render(<ThreadMessage data-testid='thread' />);
	expect(screen.getByTestId('thread')).toHaveClass('rcx-message-thread');
});
