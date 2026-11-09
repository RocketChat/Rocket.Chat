import { screen } from '@testing-library/react';

import ProgressBar from './ProgressBar.js';
import { render } from '../../testing.js';

describe('[ProgressBar Component]', () => {
	it('shows the error as its title', () => {
		render(<ProgressBar percentage={0} error='Upload failed' />);

		expect(screen.getByTitle('Upload failed')).toHaveClass('rcx-progress-bar');
	});
});
