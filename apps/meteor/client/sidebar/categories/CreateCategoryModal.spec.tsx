import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import CreateCategoryModal from './CreateCategoryModal';
import { useCreateCustomCategory } from './hooks/useCreateCustomCategory';
import { useValidateCategoryName } from './validateCategoryName';

jest.mock('./validateCategoryName', () => ({
	useValidateCategoryName: jest.fn(),
	MAX_CATEGORY_NAME_LENGTH: 30,
}));
jest.mock('./hooks/useCreateCustomCategory', () => ({
	useCreateCustomCategory: jest.fn(),
}));
jest.mock('../../components/UserAndRoomAutoCompleteMultiple', () => () => null);

const mockedUseValidateCategoryName = jest.mocked(useValidateCategoryName);
const mockedUseCreateCustomCategory = jest.mocked(useCreateCustomCategory);

const wrapper = mockAppRoot()
	.withTranslations('en', 'core', {
		Create_category: 'Create category',
		Name: 'Name',
		Rooms: 'Rooms',
		Create: 'Create',
		Cancel: 'Cancel',
		You_can_add_rooms_after: 'You can add rooms after',
		Categories_are_private_custom_groupings_of_rooms: 'Categories are private custom groupings of rooms',
		Please_enter_a_category_name: 'Please enter a category name',
		A_category_with_this_name_already_exists: 'A category with this name already exists',
	})
	.build();

beforeEach(() => {
	mockedUseValidateCategoryName.mockReturnValue(() => undefined);
	mockedUseCreateCustomCategory.mockReturnValue({
		createCategory: jest.fn(),
		createCategoryAndMoveRoom: jest.fn(),
	} as any);
});

it('shows an error when submitting with an empty name', async () => {
	mockedUseValidateCategoryName.mockReturnValue((name) => (!name.trim() ? 'Please enter a category name' : undefined));

	render(<CreateCategoryModal onClose={jest.fn()} />, { wrapper });

	await userEvent.click(screen.getByRole('button', { name: 'Create' }));

	expect(await screen.findByText('Please enter a category name')).toBeInTheDocument();
	expect(screen.getByRole('dialog', { name: 'Create category' })).toBeInTheDocument();
});

it('shows an error when submitting a duplicate name', async () => {
	mockedUseValidateCategoryName.mockReturnValue((name) =>
		name.trim().toLowerCase() === 'design' ? 'A category with this name already exists' : undefined,
	);

	render(<CreateCategoryModal onClose={jest.fn()} />, { wrapper });

	await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'DESIGN');
	await userEvent.click(screen.getByRole('button', { name: 'Create' }));

	expect(await screen.findByText('A category with this name already exists')).toBeInTheDocument();
});

it('calls createCategory and closes on valid submission', async () => {
	const createCategory = jest.fn().mockResolvedValue({ _id: 'new-id', name: 'Design' });
	const onClose = jest.fn();
	mockedUseCreateCustomCategory.mockReturnValue({ createCategory, createCategoryAndMoveRoom: jest.fn() } as any);

	render(<CreateCategoryModal onClose={onClose} />, { wrapper });

	await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Design');
	await userEvent.click(screen.getByRole('button', { name: 'Create' }));

	expect(createCategory).toHaveBeenCalledWith('Design', []);
	expect(onClose).toHaveBeenCalled();
});
