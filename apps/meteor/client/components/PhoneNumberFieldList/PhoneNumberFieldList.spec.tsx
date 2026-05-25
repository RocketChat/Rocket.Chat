import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { useFieldArray, useForm } from 'react-hook-form';

import type { PhoneFieldType } from './PhoneNumberFieldList';
import PhoneNumberFieldList from './PhoneNumberFieldList';

type PhoneFormValues = { phones: PhoneFieldType[] };

type TestComponentProps = {
	initialPhones?: PhoneFieldType[];
	onAddPhone: jest.Mock;
	onRemovePhone: jest.Mock;
};

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		Phone_Number: 'Phone Number',
		Phone_number: 'Phone number',
		Required_field: '{{field}} required',
		__field__is_invalid: '{{field}} is invalid',
		Add_phone: 'Add phone',
		Remove_phone__label__: 'Remove phone {{label}}',
		Phone_number_placeholder: 'Phone number',
		Phone_label_placeholder: 'Label',
		Label_for_phone__label__: 'Label for phone {{label}}',
		Max_length_is: 'Max length is %s',
	})
	.build();

const TestComponent = ({ initialPhones = [], onAddPhone, onRemovePhone }: TestComponentProps) => {
	const { control } = useForm<PhoneFormValues>({ defaultValues: { phones: initialPhones }, mode: 'onBlur' });
	const { fields } = useFieldArray<PhoneFormValues, 'phones'>({ control, name: 'phones' });

	return (
		<PhoneNumberFieldList
			name='phones'
			phones={fields.map((field, index) => ({ ...field, id: `mock-phone-${index}` }))}
			control={control}
			onAddPhone={onAddPhone}
			onRemovePhone={onRemovePhone}
		/>
	);
};

describe('PhoneNumberFieldList', () => {
	describe('snapshots', () => {
		it('matches snapshot with no phones', () => {
			const { baseElement } = render(<TestComponent onAddPhone={jest.fn()} onRemovePhone={jest.fn()} />, { wrapper: appRoot });
			expect(baseElement).toMatchSnapshot();
		});

		it('matches snapshot with phones', () => {
			const { baseElement } = render(
				<TestComponent
					initialPhones={[
						{ id: 'phone-1', number: '+15551234567', label: 'Home' },
						{ id: 'phone-2', number: '+15559876543', label: '' },
					]}
					onAddPhone={jest.fn()}
					onRemovePhone={jest.fn()}
				/>,
				{ wrapper: appRoot },
			);
			expect(baseElement).toMatchSnapshot();
		});
	});

	describe('accessibility', () => {
		it('should have no a11y violations with no phones', async () => {
			const { container } = render(<TestComponent onAddPhone={jest.fn()} onRemovePhone={jest.fn()} />, { wrapper: appRoot });
			expect(await axe(container)).toHaveNoViolations();
		});

		it('should have no a11y violations with phones', async () => {
			const { container } = render(
				<TestComponent
					initialPhones={[{ id: 'phone-1', number: '+15551234567', label: 'Home' }]}
					onAddPhone={jest.fn()}
					onRemovePhone={jest.fn()}
				/>,
				{ wrapper: appRoot },
			);
			expect(await axe(container)).toHaveNoViolations();
		});
	});

	describe('interactions', () => {
		it('calls onAddPhone with empty phone defaults when clicking Add phone', async () => {
			const onAddPhone = jest.fn();
			render(<TestComponent onAddPhone={onAddPhone} onRemovePhone={jest.fn()} />, { wrapper: appRoot });

			await userEvent.click(screen.getByRole('button', { name: 'Add phone' }));

			expect(onAddPhone).toHaveBeenCalledTimes(1);
			expect(onAddPhone).toHaveBeenCalledWith({ number: '', label: '', primary: false });
		});

		it('calls onRemovePhone with the correct index when clicking a remove button', async () => {
			const onRemovePhone = jest.fn();
			render(
				<TestComponent
					initialPhones={[
						{ id: 'phone-1', number: '+15551234567', label: 'Home' },
						{ id: 'phone-2', number: '+15559876543', label: 'Work' },
					]}
					onAddPhone={jest.fn()}
					onRemovePhone={onRemovePhone}
				/>,
				{ wrapper: appRoot },
			);

			await userEvent.click(screen.getAllByRole('button', { name: /remove phone/i })[0]);

			expect(onRemovePhone).toHaveBeenCalledTimes(1);
			expect(onRemovePhone).toHaveBeenCalledWith(0);
		});
	});

	describe('validation', () => {
		it('shows a required error for an empty phone number on blur', async () => {
			render(
				<TestComponent initialPhones={[{ id: 'phone-1', number: '', label: '' }]} onAddPhone={jest.fn()} onRemovePhone={jest.fn()} />,
				{ wrapper: appRoot },
			);
			const input = screen.getByRole('textbox', { name: 'Phone number 1' });
			await userEvent.click(input);
			await userEvent.tab();

			await waitFor(() => expect(input).toHaveAccessibleDescription('Phone number 1 required'));
		});

		it('shows an invalid format error for a non-E164 phone number on blur', async () => {
			render(
				<TestComponent initialPhones={[{ id: 'phone-1', number: '', label: '' }]} onAddPhone={jest.fn()} onRemovePhone={jest.fn()} />,
				{ wrapper: appRoot },
			);
			const input = screen.getByRole('textbox', { name: 'Phone number 1' });
			await userEvent.type(input, 'not-a-phone');
			await userEvent.tab();

			await waitFor(() => expect(input).toHaveAccessibleDescription('Phone number 1 is invalid'));
		});

		it('shows a max length error when the label exceeds 50 characters on blur', async () => {
			render(
				<TestComponent
					initialPhones={[{ id: 'phone-1', number: '+15551234567', label: '' }]}
					onAddPhone={jest.fn()}
					onRemovePhone={jest.fn()}
				/>,
				{ wrapper: appRoot },
			);
			const labelInput = screen.getByRole('textbox', { name: 'Label for phone 1' });
			await userEvent.type(labelInput, 'a'.repeat(51));
			await userEvent.tab();

			await waitFor(() => expect(labelInput).toHaveAccessibleDescription(/Max length is/));
		});

		it('does not show an error when the label is exactly 50 characters', async () => {
			render(
				<TestComponent
					initialPhones={[{ id: 'phone-1', number: '+15551234567', label: '' }]}
					onAddPhone={jest.fn()}
					onRemovePhone={jest.fn()}
				/>,
				{ wrapper: appRoot },
			);
			const labelInput = screen.getByRole('textbox', { name: 'Label for phone 1' });
			await userEvent.type(labelInput, 'a'.repeat(50));
			await userEvent.tab();

			await waitFor(() => expect(labelInput).not.toHaveAccessibleDescription());
		});
	});
});
