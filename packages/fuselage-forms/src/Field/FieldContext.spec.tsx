import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Field, FieldLabel, useFieldDescriptorId } from '.';
import { CheckBox, MultiSelectFiltered, TextInput } from '../Inputs';

it('should stop acting on a wrapped input after it is replaced', async () => {
	const { rerender } = render(
		<Field>
			<FieldLabel>Test Field</FieldLabel>
			<CheckBox key='first' />
		</Field>,
	);

	const firstInput = screen.getByRole('checkbox');

	rerender(
		<Field>
			<FieldLabel>Test Field</FieldLabel>
			<CheckBox key='second' />
		</Field>,
	);

	await userEvent.click(screen.getByText('Test Field', { selector: 'span' }));

	expect(firstInput).not.toBeChecked();
	expect(screen.getByRole('checkbox')).toBeChecked();
});

const Placeholder = () => <span id={useFieldDescriptorId('placeholder')}>Type here</span>;

it('should keep the input id a single token when a placeholder is registered', () => {
	render(
		<Field>
			<FieldLabel>Test Field</FieldLabel>
			<TextInput />
			<Placeholder />
		</Field>,
	);

	const input = screen.getByRole('textbox');

	expect(input.id).not.toContain(' ');
	expect(screen.getByText('Test Field')).toHaveAttribute('for', input.id);
});

it('should leave the props of an input outside a field untouched', () => {
	render(<TextInput id='custom' aria-labelledby='external' aria-invalid='true' />);

	const input = screen.getByRole('textbox');

	expect(input).toHaveAttribute('id', 'custom');
	expect(input).toHaveAttribute('aria-labelledby', 'external');
	expect(input).toHaveAttribute('aria-invalid', 'true');
	expect(input).not.toHaveAttribute('aria-describedby');
});

it('should not reference a missing label from an input outside a field', () => {
	render(<MultiSelectFiltered options={[]} onChange={() => undefined} aria-label='Players' />);

	const combobox = screen.getByRole('combobox');

	expect(combobox).not.toHaveAttribute('aria-labelledby');
	expect(combobox).toHaveAccessibleName('Players');
});

it('should keep the wrapped input name in sync with the label text', async () => {
	const { rerender } = render(
		<Field>
			<FieldLabel>Old label</FieldLabel>
			<CheckBox />
		</Field>,
	);

	expect(screen.getByRole('checkbox')).toHaveAccessibleName('Old label');

	rerender(
		<Field>
			<FieldLabel>New label</FieldLabel>
			<CheckBox />
		</Field>,
	);

	await waitFor(() => expect(screen.getByRole('checkbox')).toHaveAccessibleName('New label'));
});
