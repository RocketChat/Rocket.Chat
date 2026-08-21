import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useCategoryModals } from './useCategoryModals';
import { useRoomCategoryItems } from './useRoomCategoryItems';
import { useCustomCategories } from '../hooks/useCustomCategories';

jest.mock('../hooks/useCustomCategories', () => ({ useCustomCategories: jest.fn(), FAVORITES_TARGET: 'favorites' }));
jest.mock('./useCategoryModals', () => ({ useCategoryModals: jest.fn() }));

const mockedUseCustomCategories = jest.mocked(useCustomCategories);
const mockedUseCategoryModals = jest.mocked(useCategoryModals);

const catA = { _id: 'cat-a', name: 'Design', showUnreads: true };
const catB = { _id: 'cat-b', name: 'Engineering', showUnreads: true };

const makeCategories = () =>
	({
		hasLicenseModule: true,
		categories: [catA, catB],
		moveRoom: jest.fn(),
		removeRoom: jest.fn(),
		validateName: jest.fn(),
		createCategory: jest.fn(),
		createCategoryAndMoveRoom: jest.fn(),
		updateCategory: jest.fn(),
		deleteCategory: jest.fn(),
		toggleShowUnreads: jest.fn(),
		toggleKeepUnreadsOnTop: jest.fn(),
	}) as any;

beforeEach(() => {
	mockedUseCategoryModals.mockReturnValue({ openCreate: jest.fn(), openManage: jest.fn(), openDelete: jest.fn() });
});

const wrapper = mockAppRoot().withSetting('Favorite_Rooms', true).build();

it('marks only Favorites as selected when the room is favorited and not in a category', () => {
	mockedUseCustomCategories.mockReturnValue(makeCategories());
	const { result } = renderHook(() => useRoomCategoryItems(), { wrapper });
	const { moveToItems } = result.current({ rid: 'room-2', name: 'General', isFavorite: true });
	const selected = moveToItems.filter((item) => item.addon != null);
	expect(selected).toHaveLength(1);
	expect(selected[0].id).toBe('favorites');
});

it('marks only the matching category as selected when the room has a categoryId', () => {
	mockedUseCustomCategories.mockReturnValue(makeCategories());
	const { result } = renderHook(() => useRoomCategoryItems(), { wrapper });
	const { moveToItems } = result.current({ rid: 'room-1', name: 'Design Room', isFavorite: false, categoryId: 'cat-a' });
	const selected = moveToItems.filter((item) => item.addon != null);
	expect(selected).toHaveLength(1);
	expect(selected[0].id).toBe('cat-a');
});

it('marks only Favorites as selected when isFavorite is true even if categoryId is also set (stale state)', () => {
	mockedUseCustomCategories.mockReturnValue(makeCategories());
	const { result } = renderHook(() => useRoomCategoryItems(), { wrapper });
	const { moveToItems } = result.current({ rid: 'room-1', name: 'Design Room', isFavorite: true, categoryId: 'cat-a' });
	const selected = moveToItems.filter((item) => item.addon != null);
	expect(selected).toHaveLength(1);
	expect(selected[0].id).toBe('favorites');
});

it('marks nothing as selected when the room is neither favorited nor in a category', () => {
	mockedUseCustomCategories.mockReturnValue(makeCategories());
	const { result } = renderHook(() => useRoomCategoryItems(), { wrapper });
	const { moveToItems } = result.current({ rid: 'room-2', name: 'General', isFavorite: false });
	const selected = moveToItems.filter((item) => item.addon != null);
	expect(selected).toHaveLength(0);
});
