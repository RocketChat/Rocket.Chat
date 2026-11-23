import { screen } from '@testing-library/react';

import TextAreaInput from './TextAreaInput.js';
import { render } from '../../testing.js';

describe('[TextAreaInput]', () => {
	it('renders a textarea', () => {
		render(<TextAreaInput />);

		expect(screen.getByRole('textbox')).toBeInstanceOf(HTMLTextAreaElement);
	});
});
