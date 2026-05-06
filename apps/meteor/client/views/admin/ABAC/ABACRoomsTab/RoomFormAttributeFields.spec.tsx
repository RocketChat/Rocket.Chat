import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import type { RoomFormData } from './RoomForm';
import RoomFormAttributeFields from './RoomFormAttributeFields';

const mockAttribute1 = {
	_id: 'attr1',
	key: 'Department',
	values: ['Engineering', 'Sales', 'Marketing'],
};

const mockAttribute2 = {
	_id: 'attr2',
	key: 'Security-Level',
	values: ['Public', 'Internal', 'Confidential'],
};

const mockAttribute3 = {
	_id: 'attr3',
	key: 'Location',
	values: ['US', 'EU', 'APAC'],
};

const mockAttributes = [mockAttribute1, mockAttribute2, mockAttribute3];

jest.mock('../hooks/useAttributeList', () => ({
	useAttributeKeysList: jest.fn(() => ({
		data: mockAttributes.map((attribute) => ({
			_id: attribute._id,
			value: attribute.key,
			label: attribute.key,
			attributeValues: attribute.values,
		})),
		fetchNextPage: jest.fn(),
		isLoading: false,
	})),
	useSelectedAttribute: jest.fn((key?: string) => ({
		data: key ? mockAttributes.find((attribute) => attribute.key === key) : undefined,
		isLoading: false,
	})),
}));

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		Attribute: 'Attribute',
		ABAC_Search_Attribute: 'Search attribute',
		ABAC_Select_Attribute_Values: 'Select attribute values',
		Remove: 'Remove',
	})
	.build();

const FormProviderWrapper = ({ children, defaultValues }: { children: ReactNode; defaultValues?: Partial<RoomFormData> }) => {
	const methods = useForm<RoomFormData>({
		defaultValues: {
			room: '',
			attributes: [{ key: '', values: [] }],
			...defaultValues,
		},
		mode: 'onChange',
	});

	return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('RoomFormAttributeFields', () => {
	const mockRemove = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should render the correct number of fields', () => {
		const fields = [{ id: 'field-1' }, { id: 'field-2' }, { id: 'field-3' }];

		render(
			<FormProviderWrapper>
				<RoomFormAttributeFields fields={fields} remove={mockRemove} />
			</FormProviderWrapper>,
			{ wrapper: appRoot },
		);

		const attributeLabels = screen.getAllByText('Attribute');
		expect(attributeLabels).toHaveLength(3);
	});

	it('should render a single field', () => {
		const fields = [{ id: 'field-1' }];

		render(
			<FormProviderWrapper>
				<RoomFormAttributeFields fields={fields} remove={mockRemove} />
			</FormProviderWrapper>,
			{ wrapper: appRoot },
		);

		const attributeLabels = screen.getAllByText('Attribute');
		expect(attributeLabels).toHaveLength(1);
	});

	it('should render multiple fields', () => {
		const fields = [{ id: 'field-1' }, { id: 'field-2' }, { id: 'field-3' }, { id: 'field-4' }, { id: 'field-5' }];

		render(
			<FormProviderWrapper>
				<RoomFormAttributeFields fields={fields} remove={mockRemove} />
			</FormProviderWrapper>,
			{ wrapper: appRoot },
		);

		const attributeLabels = screen.getAllByText('Attribute');
		expect(attributeLabels).toHaveLength(5);
	});

	it('should render fields with provided default values', () => {
		const fields = [{ id: 'field-1' }, { id: 'field-2' }];

		render(
			<FormProviderWrapper
				defaultValues={{
					attributes: [
						{ key: 'Department', values: ['Engineering'] },
						{ key: 'Security-Level', values: ['Public', 'Internal'] },
					],
				}}
			>
				<RoomFormAttributeFields fields={fields} remove={mockRemove} />
			</FormProviderWrapper>,
			{ wrapper: appRoot },
		);

		const attributeLabels = screen.getAllByText('Attribute');
		expect(attributeLabels).toHaveLength(2);
		expect(screen.getByText('Department')).toBeInTheDocument();
		expect(screen.getByText('Engineering')).toBeInTheDocument();
		expect(screen.getByText('Security-Level')).toBeInTheDocument();
		expect(screen.getByText('Public')).toBeInTheDocument();
		expect(screen.getByText('Internal')).toBeInTheDocument();
	});
});
