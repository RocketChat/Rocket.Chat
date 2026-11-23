import { screen } from '@testing-library/react';

import { Icon } from './index.js';
import { render } from '../../testing.js';

describe('[Icon Component]', () => {
	it('renders without crashing', () => {
		render(<Icon name='chat' data-testid='icon' />);
		expect(screen.getByTestId('icon')).toHaveClass('rcx-icon--name-chat');
	});
});
