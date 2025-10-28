import type { CustomFieldMetadata } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Control } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { CustomFieldsForm } from './CustomFieldsForm';

type TestComponentProps = {
	metadata: CustomFieldMetadata[];
	formName: string;
	onSubmit: (data: any) => void;
};

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		Required_field: '{{field}} required',
	})
	.build();

const TestComponent = ({ metadata, formName, onSubmit }: TestComponentProps) => {
	const { control, handleSubmit } = useForm({ mode: 'onBlur' });

	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<CustomFieldsForm formName={formName} formControl={control as unknown as Control<any>} metadata={metadata} />
			<button type='submit'>Submit</button>
		</form>
	);
};

describe('CustomFieldsForm', () => {
	it('should render all custom fields', () => {
		const metadata: CustomFieldMetadata[] = [
			{ name: 'field1', type: 'text', label: 'Field 1', required: true, defaultValue: '', options: [] },
			{
				name: 'field2',
				type: 'select',
				label: 'Field 2',
				required: false,
				defaultValue: 'a',
				options: [
					['a', 'a'],
					['b', 'b'],
				],
			},
		];

		render(<TestComponent metadata={metadata} formName='testForm' onSubmit={jest.fn()} />);

		expect(screen.getByRole('textbox', { name: 'Field 1' })).toBeInTheDocument();
		expect(within(screen.getByLabelText('Field 2')).getByRole('combobox', { hidden: true })).toBeInTheDocument();
	});

	it('should render a text input', () => {
		const metadata: CustomFieldMetadata[] = [
			{ name: 'field1', type: 'text', label: 'Field 1', required: true, defaultValue: '', options: [] },
		];

		render(<TestComponent metadata={metadata} formName='testForm' onSubmit={jest.fn()} />, { wrapper: appRoot });

		expect(screen.getByRole('textbox', { name: 'Field 1' })).toBeInTheDocument();
	});

	it('should render a select input', () => {
		const metadata: CustomFieldMetadata[] = [
			{
				name: 'field2',
				type: 'select',
				label: 'Field 2',
				required: false,
				defaultValue: 'a',
				options: [
					['a', 'a'],
					['b', 'b'],
				],
			},
		];

		render(<TestComponent metadata={metadata} formName='testForm' onSubmit={jest.fn()} />, { wrapper: appRoot });

		expect(within(screen.getByLabelText('Field 2')).getByRole('combobox', { hidden: true })).toBeInTheDocument();
	});

	it('should show required error message', async () => {
		const metadata: CustomFieldMetadata[] = [
			{ name: 'field1', type: 'text', label: 'Field 1', required: true, defaultValue: '', options: [] },
		];

		render(<TestComponent metadata={metadata} formName='testForm' onSubmit={jest.fn()} />);

		const input = screen.getByRole('textbox', { name: 'Field 1' });
		await userEvent.click(input);
		await userEvent.tab();

		await waitFor(() => expect(input).toHaveAccessibleDescription('Field 1 required'));
	});

	it('should show minLength error message', async () => {
		const metadata: CustomFieldMetadata[] = [
			{ name: 'field1', type: 'text', label: 'Field 1', required: true, minLength: 5, defaultValue: '', options: [] },
		];

		render(<TestComponent metadata={metadata} formName='testForm' onSubmit={jest.fn()} />, { wrapper: appRoot });

		const input = screen.getByRole('textbox', { name: 'Field 1' });
		await userEvent.type(input, '123');
		await userEvent.tab();

		await waitFor(() => expect(input).toHaveAccessibleDescription('Min_length_is'));
	});

	it('should validate maxLength', async () => {
		const metadata: CustomFieldMetadata[] = [
			{ name: 'field1', type: 'text', label: 'Field 1', required: true, maxLength: 3, defaultValue: '', options: [] },
		];

		render(<TestComponent metadata={metadata} formName='testForm' onSubmit={jest.fn()} />, { wrapper: appRoot });

		const input = screen.getByRole('textbox', { name: 'Field 1' });
		await userEvent.type(input, '123456');
		await userEvent.tab();

		expect(input).toHaveValue('123');
	});

	it('should not throw when attempting to render invalid field type', () => {
		const metadata: CustomFieldMetadata[] = [
			{ name: 'field1', type: 'invalid_type' as any, label: 'Field 1', required: true, defaultValue: '', options: [] },
		];

		expect(() =>
			render(<TestComponent metadata={metadata} formName='testForm' onSubmit={jest.fn()} />, { wrapper: appRoot }),
		).not.toThrow();

		expect(screen.queryByLabelText('Field 1')).not.toBeInTheDocument();
	});
});
