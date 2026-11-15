import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import CreateCategoryModal from './CreateCategoryModal';
import { useCreateCustomCategory } from './hooks/useCreateCustomCategory';
import { useValidateCategoryName } from './hooks/useValidateCategoryName';

jest.mock('./hooks/useValidateCategoryName', () => ({
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

const mutateAsync = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
	mutateAsync.mockClear();
	mockedUseValidateCategoryName.mockReturnValue(() => undefined);
	mockedUseCreateCustomCategory.mockReturnValue({ mutateAsync, isPending: false } as any);
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

it('calls mutateAsync on valid submission and wires onClose as settleCallback', async () => {
	const onClose = jest.fn();

	render(<CreateCategoryModal onClose={onClose} />, { wrapper });

	await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Design');
	await userEvent.click(screen.getByRole('button', { name: 'Create' }));

	expect(mockedUseCreateCustomCategory).toHaveBeenCalledWith(expect.objectContaining({ settleCallback: onClose }));
	expect(mutateAsync).toHaveBeenCalledWith({ name: 'Design', roomIds: [], movedRoom: undefined });
});
