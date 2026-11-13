import { render, screen } from '@testing-library/react';

import { Field, FieldLabel, FieldError } from '.';
import { TextInput } from '../Inputs';

it('should have an alert element', () => {
	render(
		<Field>
			<FieldLabel>Test Field</FieldLabel>
			<TextInput />
			<FieldError>Error message</FieldError>
		</Field>,
	);

	expect(screen.getByRole('alert')).toHaveTextContent('Error message');
});

it('should have an id that matches the aria-describedby on the input', () => {
	render(
		<Field>
			<FieldLabel>Test Field</FieldLabel>
			<TextInput />
			<FieldError>Error message</FieldError>
		</Field>,
	);

	expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Error message');
});

it('should set aria-invalid="true" on the input when error is present', () => {
	render(
		<Field>
			<FieldLabel>Test Field</FieldLabel>
			<TextInput />
			<FieldError>Error message</FieldError>
		</Field>,
	);

	expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
});

it('should set aria-invalid="false" on the input when no error is present', () => {
	render(
		<Field>
			<FieldLabel>Test Field</FieldLabel>
			<TextInput />
		</Field>,
	);

	expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
});
