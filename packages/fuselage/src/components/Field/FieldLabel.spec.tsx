import { render, screen } from '@testing-library/react';

import FieldLabel from './FieldLabel';

describe('[FieldLabel Component]', () => {
	it('should render required asterisk when required prop is true', () => {
		render(
			<FieldLabel required htmlFor='test-field'>
				Test Label
			</FieldLabel>,
		);

		expect(screen.getByText('*')).toBeInTheDocument();
	});

	it('should render required asterisk when using custom element', () => {
		render(
			<FieldLabel is='span' id='test-field' required>
				Test Label
			</FieldLabel>,
		);

		expect(screen.getByText('*')).toBeInTheDocument();
	});

	it('should not render required asterisk when required prop is false', () => {
		render(<FieldLabel htmlFor='test-field'>Test Label</FieldLabel>);

		expect(screen.queryByText('*')).not.toBeInTheDocument();
	});
});
