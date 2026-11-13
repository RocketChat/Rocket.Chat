import { screen } from '@testing-library/react';

import { MessageDivider } from '.';
import { render } from '../../../testing';

it('renders without crashing', () => {
	render(<MessageDivider />);
	expect(screen.getByRole('separator')).toHaveClass('rcx-message-divider');
});
