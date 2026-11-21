import { screen } from '@testing-library/react';

import TextAreaInput from './TextAreaInput';
import { render } from '../../testing';

describe('[TextAreaInput]', () => {
	it('renders a textarea', () => {
		render(<TextAreaInput />);

		expect(screen.getByRole('textbox')).toBeInstanceOf(HTMLTextAreaElement);
	});

	it('renders a textarea when spread props carry another type', () => {
		const props = { type: 'text' };
		render(<TextAreaInput {...props} aria-label='Description' />);

		expect(screen.getByLabelText('Description')).toBeInstanceOf(HTMLTextAreaElement);
	});
});
