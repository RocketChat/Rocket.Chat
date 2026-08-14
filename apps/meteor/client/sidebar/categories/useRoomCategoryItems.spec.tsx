import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useCategoryModals } from './useCategoryModals';
import { useRoomCategoryItems } from './useRoomCategoryItems';
import { useCustomCategories } from '../hooks/useCustomCategories';

jest.mock('../hooks/useCustomCategories', () => ({ useCustomCategories: jest.fn(), FAVORITES_TARGET: 'favorites' }));
jest.mock('./useCategoryModals', () => ({ useCategoryModals: jest.fn() }));

const mockedUseCustomCategories = jest.mocked(useCustomCategories);
const mockedUseCategoryModals = jest.mocked(useCategoryModals);

const catA = { _id: 'cat-a', name: 'Design', rooms: ['room-1'], showUnreads: true };
const catB = { _id: 'cat-b', name: 'Engineering', rooms: [] as string[], showUnreads: true };

const makeCategories = (categorizedRid?: string) =>
	({
		hasLicenseModule: true,
		categories: [catA, catB],
		moveRoom: jest.fn(),
		removeRoom: jest.fn(),
		getRoomCategory: jest.fn((rid: string) => (categorizedRid && rid === categorizedRid ? catA : undefined)),
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

it('marks only the matching category as selected when the room is in a category', () => {
	mockedUseCustomCategories.mockReturnValue(makeCategories('room-1'));
	const { result } = renderHook(() => useRoomCategoryItems(), { wrapper });
	const { moveToItems } = result.current({ rid: 'room-1', name: 'Design Room', isFavorite: false });
	const selected = moveToItems.filter((item) => item.addon != null);
	expect(selected).toHaveLength(1);
	expect(selected[0].id).toBe('cat-a');
});

it('marks nothing as selected when the room is neither favorited nor in a category', () => {
	mockedUseCustomCategories.mockReturnValue(makeCategories());
	const { result } = renderHook(() => useRoomCategoryItems(), { wrapper });
	const { moveToItems } = result.current({ rid: 'room-2', name: 'General', isFavorite: false });
	const selected = moveToItems.filter((item) => item.addon != null);
	expect(selected).toHaveLength(0);
});
