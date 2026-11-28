import { screen } from '@testing-library/react';

import TextAreaInput from './TextAreaInput';
import { render } from '../../testing';

describe('[TextAreaInput]', () => {
	it('renders a textarea', () => {
		render(<TextAreaInput />);

		expect(screen.getByRole('textbox')).toBeInstanceOf(HTMLTextAreaElement);
	});
});
