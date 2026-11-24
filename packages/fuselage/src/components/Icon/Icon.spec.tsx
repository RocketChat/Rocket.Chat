import { screen } from '@testing-library/react';

import { Icon } from '.';
import { render } from '../../testing';

describe('[Icon Component]', () => {
	it('renders without crashing', () => {
		render(<Icon name='chat' data-testid='icon' />);
		expect(screen.getByTestId('icon')).toHaveClass('rcx-icon--name-chat');
	});
});
