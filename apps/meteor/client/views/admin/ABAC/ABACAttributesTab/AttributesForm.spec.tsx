/* eslint-disable @typescript-eslint/naming-convention */
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import AttributesForm, { type AttributesFormFormData } from './AttributesForm';
import * as stories from './AttributesForm.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		Name: 'Name',
		Values: 'Values',
		Add_Value: 'Add Value',
		Cancel: 'Cancel',
		Save: 'Save',
		Required_field: '{{field}} is required',
	})
	.withEndpoint('GET', '/v1/abac/attributes/:key/is-in-use', async () => ({ inUse: false }))
	.build();

const FormProviderWrapper = ({ children, defaultValues }: { children: ReactNode; defaultValues?: Partial<AttributesFormFormData> }) => {
	const methods = useForm<AttributesFormFormData>({
		defaultValues: {
			name: '',
			attributeValues: [{ value: '' }],
			lockedAttributes: [],
			...defaultValues,
		},
		mode: 'onChange',
	});

	return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('AttributesForm', () => {
	const defaultProps = {
		onSave: jest.fn(),
		onCancel: jest.fn(),
		description: 'Create an attribute that can later be assigned to rooms.',
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		const { baseElement } = render(<Story />, { wrapper: appRoot });

		expect(baseElement).toMatchSnapshot();
	});

	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />, { wrapper: appRoot });

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should show validation errors for required fields', async () => {
		render(
			<FormProviderWrapper>
				<AttributesForm {...defaultProps} />
			</FormProviderWrapper>,
			{ wrapper: appRoot },
		);

		// Making the form "touched"
		const nameInput = screen.getByLabelText('Name*');
		await userEvent.type(nameInput, 'Test Attribute');
		await userEvent.clear(nameInput);

		const saveButton = screen.getByRole('button', { name: 'Save' });
		await userEvent.click(saveButton);

		await waitFor(() => {
			expect(screen.getByText('Name is required')).toBeInTheDocument();
		});
	});

	it('should show validation error for empty attribute values', async () => {
		render(
			<FormProviderWrapper>
				<AttributesForm {...defaultProps} />
			</FormProviderWrapper>,
			{ wrapper: appRoot },
		);

		const nameInput = screen.getByLabelText('Name*');
		await userEvent.type(nameInput, 'Test Attribute');

		const saveButton = screen.getByRole('button', { name: 'Save' });
		await userEvent.click(saveButton);

		await waitFor(() => {
			expect(screen.getByText('Values is required')).toBeInTheDocument();
		});
	});

	it('should add new attribute value when Add Value button is clicked', async () => {
		const defaultValues = {
			name: 'Test Attribute',
			attributeValues: [{ value: 'Value 1' }],
		};

		render(
			<FormProviderWrapper defaultValues={defaultValues}>
				<AttributesForm {...defaultProps} />
			</FormProviderWrapper>,
			{ wrapper: appRoot },
		);

		const addButton = screen.getByRole('button', { name: 'Add Value' });
		await userEvent.click(addButton);

		const valueInputs = screen.getAllByLabelText('Values*');
		expect(valueInputs).toHaveLength(2);
	});

	it('should remove attribute value when trash button is clicked', async () => {
		const defaultValues = {
			name: 'Test Attribute',
			attributeValues: [{ value: 'Value 1' }, { value: 'Value 2' }],
		};

		render(
			<FormProviderWrapper defaultValues={defaultValues}>
				<AttributesForm {...defaultProps} />
			</FormProviderWrapper>,
			{ wrapper: appRoot },
		);

		const trashButtons = screen.getAllByRole('button', { name: 'ABAC_Remove_attribute' });
		expect(screen.getByDisplayValue('Value 1')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Value 2')).toBeInTheDocument();

		await userEvent.click(trashButtons[0]);

		expect(screen.getByDisplayValue('Value 1')).toBeInTheDocument();
		expect(screen.queryByDisplayValue('Value 2')).not.toBeInTheDocument();
	});

	it('should remove locked attribute when trash button is clicked', async () => {
		const defaultValues = {
			name: 'Room Type',
			lockedAttributes: [{ value: 'Locked Value 1' }, { value: 'Locked Value 2' }],
		};

		render(
			<FormProviderWrapper defaultValues={defaultValues}>
				<AttributesForm {...defaultProps} />
			</FormProviderWrapper>,
			{ wrapper: appRoot },
		);

		const trashButtons = screen.queryAllByRole('button', { name: 'ABAC_Remove_attribute' });

		expect(screen.getByDisplayValue('Locked Value 1')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Locked Value 2')).toBeInTheDocument();

		await userEvent.click(trashButtons[0]);

		expect(screen.getByDisplayValue('Locked Value 1')).toBeInTheDocument();
		expect(screen.queryByDisplayValue('Locked Value 2')).not.toBeInTheDocument();
	});

	it('should disable Add Value button when there are empty values', async () => {
		render(
			<FormProviderWrapper>
				<AttributesForm {...defaultProps} />
			</FormProviderWrapper>,
			{ wrapper: appRoot },
		);

		const addButton = screen.getByRole('button', { name: 'Add Value' });
		expect(addButton).toBeDisabled();
	});

	it('should enable Add Value button when all values are filled', async () => {
		const defaultValues = {
			name: 'Test Attribute',
			attributeValues: [{ value: 'Value 1' }],
		};

		render(
			<FormProviderWrapper defaultValues={defaultValues}>
				<AttributesForm {...defaultProps} />
			</FormProviderWrapper>,
			{ wrapper: appRoot },
		);

		const addButton = screen.getByRole('button', { name: 'Add Value' });
		expect(addButton).not.toBeDisabled();
	});

	it('should call onSave with correct data when form is submitted', async () => {
		const defaultValues = {
			name: 'Test Attribute',
			attributeValues: [{ value: 'Value 1' }, { value: 'Value 2' }],
		};

		render(
			<FormProviderWrapper defaultValues={defaultValues}>
				<AttributesForm {...defaultProps} />
			</FormProviderWrapper>,
			{ wrapper: appRoot },
		);

		const trashButtons = screen.queryAllByRole('button', { name: 'ABAC_Remove_attribute' });
		await userEvent.click(trashButtons[0]);

		const saveButton = screen.getByRole('button', { name: 'Save' });
		await userEvent.click(saveButton);

		await waitFor(() => {
			expect(defaultProps.onSave).toHaveBeenCalled();
		});
	});

	it('should call onCancel when Cancel button is clicked', async () => {
		render(
			<FormProviderWrapper>
				<AttributesForm {...defaultProps} />
			</FormProviderWrapper>,
			{ wrapper: appRoot },
		);

		const cancelButton = screen.getByRole('button', { name: 'Cancel' });
		await userEvent.click(cancelButton);

		expect(defaultProps.onCancel).toHaveBeenCalled();
	});

	it('should handle mixed locked and regular attributes correctly', async () => {
		const defaultValues = {
			name: 'Room Type',
			lockedAttributes: [{ value: 'Locked Value' }],
			attributeValues: [{ value: 'Regular Value' }],
		};

		render(
			<FormProviderWrapper defaultValues={defaultValues}>
				<AttributesForm {...defaultProps} />
			</FormProviderWrapper>,
			{ wrapper: appRoot },
		);

		expect(screen.getByDisplayValue('Locked Value')).toBeDisabled();
		expect(screen.getByDisplayValue('Regular Value')).not.toBeDisabled();

		const trashButtons = screen.getAllByRole('button', { name: 'ABAC_Remove_attribute' });
		expect(trashButtons).toHaveLength(1);
	});

	it('should show disclaimer when trying to delete a locked attribute value that is in use', async () => {
		const defaultValues = {
			name: 'Test Attribute',
			lockedAttributes: [{ value: 'Value 1' }, { value: 'Value 2' }],
		};
		render(
			<FormProviderWrapper defaultValues={defaultValues}>
				<AttributesForm {...defaultProps} />
			</FormProviderWrapper>,
			{
				wrapper: mockAppRoot()
					.withEndpoint('GET', '/v1/abac/attributes/:key/is-in-use', async () => ({ inUse: true }))
					.withTranslations('en', 'core', {
						ABAC_Cannot_delete_attribute_value_in_use: 'Cannot delete attribute value assigned to rooms. <1>View rooms</1>',
					})
					.build(),
			},
		);

		const trashButtons = screen.getAllByRole('button', { name: 'ABAC_Remove_attribute' });
		await userEvent.click(trashButtons[0]);

		await waitFor(() => {
			expect(screen.getByText('Cannot delete attribute value assigned to rooms.')).toBeInTheDocument();
		});

		expect(screen.getByText('Cannot delete attribute value assigned to rooms.')).toBeInTheDocument();
	});
});
