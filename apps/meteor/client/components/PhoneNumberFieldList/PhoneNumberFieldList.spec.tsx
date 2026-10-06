import type { IUserPhoneNumber } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { useForm } from 'react-hook-form';

import PhoneNumberFieldList from './PhoneNumberFieldList';
import { getInitialPhones } from './phoneNumbers';

type PhoneFormValues = { phones: IUserPhoneNumber[] };

type TestComponentProps = {
	initialPhones?: IUserPhoneNumber[];
};

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		Phone_Numbers: 'Phone Numbers',
		Phone_number: 'Phone number',
		Required_field: '{{field}} required',
		__field__is_invalid: '{{field}} is invalid',
		Add_number: 'Add number',
		Remove_number__label__: 'Remove number {{label}}',
		Label: 'Label',
		Phone_label_hint: 'Others can see name alongside number',
		Phone_label_placeholder: 'Label',
		Label_for_phone_number__label__: 'Label for phone number {{label}}',
		Max_length_is: 'Max length is %s',
	})
	.build();

const TestComponent = ({ initialPhones = [] }: TestComponentProps) => {
	const { control } = useForm<PhoneFormValues>({ defaultValues: { phones: getInitialPhones(initialPhones) }, mode: 'onBlur' });

	return <PhoneNumberFieldList control={control} />;
};

const getNumberInputs = () => screen.getAllByRole('textbox', { name: /^Phone number \d+$/ });

describe('PhoneNumberFieldList', () => {
	describe('snapshots', () => {
		it('matches snapshot with no phones', () => {
			const { baseElement } = render(<TestComponent />, { wrapper: appRoot });
			expect(baseElement).toMatchSnapshot();
		});

		it('matches snapshot with phones', () => {
			const { baseElement } = render(
				<TestComponent
					initialPhones={[
						{ number: '+15551234567', label: 'Home' },
						{ number: '+15559876543', label: '' },
					]}
				/>,
				{ wrapper: appRoot },
			);
			expect(baseElement).toMatchSnapshot();
		});
	});

	describe('accessibility', () => {
		it('should have no a11y violations with no phones', async () => {
			const { container } = render(<TestComponent />, { wrapper: appRoot });
			expect(await axe(container)).toHaveNoViolations();
		});

		it('should have no a11y violations with phones', async () => {
			const { container } = render(<TestComponent initialPhones={[{ number: '+15551234567', label: 'Home' }]} />, { wrapper: appRoot });
			expect(await axe(container)).toHaveNoViolations();
		});
	});

	describe('interactions', () => {
		it('adds a blank row when clicking Add number', async () => {
			render(<TestComponent initialPhones={[{ number: '+15551234567', label: 'Home' }]} />, { wrapper: appRoot });

			await userEvent.click(screen.getByRole('button', { name: 'Add number' }));

			const inputs = getNumberInputs();
			expect(inputs).toHaveLength(2);
			expect(inputs[1]).toHaveValue('');
		});

		it('removes the row whose remove button was clicked', async () => {
			render(
				<TestComponent
					initialPhones={[
						{ number: '+15551234567', label: 'Home' },
						{ number: '+15559876543', label: 'Work' },
					]}
				/>,
				{ wrapper: appRoot },
			);

			await userEvent.click(screen.getByRole('button', { name: 'Remove number Home' }));

			const inputs = getNumberInputs();
			expect(inputs).toHaveLength(1);
			expect(inputs[0]).toHaveValue('+15559876543');
		});

		it('clears the last row instead of removing it', async () => {
			render(<TestComponent initialPhones={[{ number: '+15551234567', label: 'Home' }]} />, { wrapper: appRoot });

			await userEvent.click(screen.getByRole('button', { name: 'Remove number Home' }));

			const inputs = getNumberInputs();
			expect(inputs).toHaveLength(1);
			expect(inputs[0]).toHaveValue('');
			expect(screen.getByRole('textbox', { name: 'Label for phone number 1' })).toHaveValue('');
		});
	});

	describe('validation', () => {
		it('does not show an error for a single blank row', async () => {
			render(<TestComponent />, { wrapper: appRoot });
			const input = screen.getByRole('textbox', { name: 'Phone number 1' });
			await userEvent.click(input);
			await userEvent.tab();

			await waitFor(() => expect(input).not.toHaveAccessibleDescription());
		});

		it('shows a required error for an empty phone number when its label is filled', async () => {
			render(<TestComponent initialPhones={[{ number: '', label: 'Home' }]} />, { wrapper: appRoot });
			const input = screen.getByRole('textbox', { name: 'Phone number 1' });
			await userEvent.click(input);
			await userEvent.tab();

			await waitFor(() => expect(input).toHaveAccessibleDescription('Phone number 1 required'));
		});

		it('shows a required error on the phone number after filling its label', async () => {
			render(<TestComponent />, { wrapper: appRoot });
			const input = screen.getByRole('textbox', { name: 'Phone number 1' });
			await userEvent.type(screen.getByRole('textbox', { name: 'Label for phone number 1' }), 'Home');
			await userEvent.tab();

			await waitFor(() => expect(input).toHaveAccessibleDescription('Phone number 1 required'));
		});

		it('does not show an error for a blank row when there are multiple rows', async () => {
			render(
				<TestComponent
					initialPhones={[
						{ number: '+15551234567', label: '' },
						{ number: '', label: '' },
					]}
				/>,
				{ wrapper: appRoot },
			);
			const input = screen.getByRole('textbox', { name: 'Phone number 2' });
			await userEvent.click(input);
			await userEvent.tab();

			await waitFor(() => expect(input).not.toHaveAccessibleDescription());
		});

		it('does not show an error when both number and label are filled', async () => {
			render(<TestComponent initialPhones={[{ number: '+15551234567', label: 'Home' }]} />, { wrapper: appRoot });
			const input = screen.getByRole('textbox', { name: 'Phone number 1' });
			await userEvent.click(input);
			await userEvent.tab();

			await waitFor(() => expect(input).not.toHaveAccessibleDescription());
		});

		it('validates a stored phone without a label', async () => {
			render(<TestComponent initialPhones={[{ number: '+15551234567' }]} />, { wrapper: appRoot });
			const input = screen.getByRole('textbox', { name: 'Phone number 1' });
			await userEvent.click(input);
			await userEvent.tab();

			await waitFor(() => expect(input).not.toHaveAccessibleDescription());
		});

		it('shows an invalid format error for a non-E164 phone number on blur', async () => {
			render(<TestComponent />, { wrapper: appRoot });
			const input = screen.getByRole('textbox', { name: 'Phone number 1' });
			await userEvent.type(input, 'not-a-phone');
			await userEvent.tab();

			await waitFor(() => expect(input).toHaveAccessibleDescription('Phone number 1 is invalid'));
		});

		it('shows a max length error when the label exceeds 50 characters on blur', async () => {
			render(<TestComponent initialPhones={[{ number: '+15551234567', label: '' }]} />, { wrapper: appRoot });
			const labelInput = screen.getByRole('textbox', { name: 'Label for phone number 1' });
			await userEvent.type(labelInput, 'a'.repeat(51));
			await userEvent.tab();

			await waitFor(() => expect(labelInput).toHaveAccessibleDescription(/Max length is/));
		});

		it('only shows the hint when the label is exactly 50 characters', async () => {
			render(<TestComponent initialPhones={[{ number: '+15551234567', label: '' }]} />, { wrapper: appRoot });
			const labelInput = screen.getByRole('textbox', { name: 'Label for phone number 1' });
			await userEvent.type(labelInput, 'a'.repeat(50));
			await userEvent.tab();

			await waitFor(() => expect(labelInput).toHaveAccessibleDescription('Others can see name alongside number'));
		});
	});
});
