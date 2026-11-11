import Input from './Input';
import { render } from '../../testing';

describe('[Input]', () => {
	it('should be decorated by default', () => {
		const { getByRole } = render(<Input aria-label='Name' />);

		expect(getByRole('textbox')).toHaveClass('rcx-input-box');
		expect(getByRole('textbox')).not.toHaveClass('rcx-input-box--undecorated');
	});

	it('should drop its decoration when undecorated', () => {
		const { getByRole } = render(<Input aria-label='Name' undecorated />);

		expect(getByRole('textbox')).toHaveClass('rcx-input-box', 'rcx-input-box--undecorated');
		expect(getByRole('textbox')).not.toHaveAttribute('undecorated');
	});
});
