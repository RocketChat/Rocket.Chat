import { screen } from '@testing-library/react';

import { MessageDivider } from './index.js';
import { render } from '../../../testing.js';

it('renders without crashing', () => {
	render(<MessageDivider />);
	expect(screen.getByRole('separator')).toHaveClass('rcx-message-divider');
});
