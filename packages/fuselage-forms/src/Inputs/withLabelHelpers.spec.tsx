import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import { Field, FieldLabel } from '../Field';
import { EmailInput, NumberInput, PasswordInput, SearchInput, TextAreaInput, TextInput, UrlInput } from './WrappedInputComponents';

// What a consumer passes a wrapped input, next to the id the field hands it, has to reach the DOM element
describe('[withLabelId] spread completeness', () => {
	it.each([
		['TextInput', TextInput],
		['EmailInput', EmailInput],
		['PasswordInput', PasswordInput],
		['SearchInput', SearchInput],
		['NumberInput', NumberInput],
		['UrlInput', UrlInput],
	] as const)('%s forwards the field id and every consumer attribute', async (_name, Input) => {
		const onChange = jest.fn();
		const onBlur = jest.fn();
		const ref = createRef<HTMLInputElement>();

		const { container } = render(
			<Field>
				<FieldLabel>Name</FieldLabel>
				<Input
					{...{ ref }}
					name='field-name'
					data-qa='consumer-qa'
					placeholder='Type'
					disabled={false}
					required
					onChange={onChange}
					onBlur={onBlur}
				/>
			</Field>,
		);

		const input = container.querySelector('input') as HTMLInputElement;
		expect(ref.current).toBe(input);
		expect(input.id).not.toBe('');
		expect(screen.getByText('Name', { selector: 'label' })).toHaveAttribute('for', input.id);
		expect(input).toHaveAttribute('name', 'field-name');
		expect(input).toHaveAttribute('data-qa', 'consumer-qa');
		expect(input).toHaveAttribute('placeholder', 'Type');
		expect(input).toBeRequired();

		await userEvent.type(input, '1');
		expect(onChange).toHaveBeenCalled();
		await userEvent.tab();
		expect(onBlur).toHaveBeenCalled();
	});

	it('forwards what a textarea takes', () => {
		render(
			<Field>
				<FieldLabel>Notes</FieldLabel>
				<TextAreaInput rows={3} name='notes' maxLength={10} />
			</Field>,
		);

		const area = screen.getByRole('textbox', { name: 'Notes' });
		expect(area).toHaveAttribute('rows', '3');
		expect(area).toHaveAttribute('name', 'notes');
		expect(area).toHaveAttribute('maxlength', '10');
	});
});
