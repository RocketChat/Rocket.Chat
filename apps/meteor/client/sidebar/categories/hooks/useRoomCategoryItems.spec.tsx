import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useCategoryModals } from './useCategoryModals';
import { useMoveRoomCategory } from './useMoveRoomCategory';
import { useRoomCategoryItems } from './useRoomCategoryItems';
import { useUserSidebarCategories } from './useUserSidebarCategories';

jest.mock('./useUserSidebarCategories', () => ({ useUserSidebarCategories: jest.fn(), FAVORITES_TARGET: 'favorites' }));
jest.mock('./useMoveRoomCategory', () => ({ useMoveRoomCategory: jest.fn() }));
jest.mock('./useCategoryModals', () => ({ useCategoryModals: jest.fn() }));
jest.mock('../../../hooks/useHasLicenseModule', () => ({ useHasLicenseModule: () => ({ data: true }) }));

const mockedUseCustomCategories = jest.mocked(useUserSidebarCategories);
const mockedUseMoveRoomCategory = jest.mocked(useMoveRoomCategory);
const mockedUseCategoryModals = jest.mocked(useCategoryModals);

const catA = { _id: 'cat-a', name: 'Design', showUnreads: true };
const catB = { _id: 'cat-b', name: 'Engineering', showUnreads: true };

beforeEach(() => {
	mockedUseCustomCategories.mockReturnValue({ customCategories: [catA, catB] } as any);
	mockedUseMoveRoomCategory.mockReturnValue({ mutate: jest.fn(), mutateAsync: jest.fn() } as any);
	mockedUseCategoryModals.mockReturnValue({ openCreate: jest.fn(), openManage: jest.fn(), openDelete: jest.fn() });
});

const wrapper = mockAppRoot().withSetting('Favorite_Rooms', true).build();

it('marks only Favorites as selected when the room is favorited and not in a category', () => {
	const { result } = renderHook(() => useRoomCategoryItems({ rid: 'room-2', name: 'General', isFavorite: true }), { wrapper });
	const { moveToItems } = result.current;
	const selected = moveToItems.filter((item) => item.addon != null);
	expect(selected).toHaveLength(1);
	expect(selected[0].id).toBe('favorites');
});

it('marks only the matching category as selected when the room has a categoryId', () => {
	const { result } = renderHook(
		() => useRoomCategoryItems({ rid: 'room-1', name: 'Design Room', isFavorite: false, categoryId: 'cat-a' }),
		{ wrapper },
	);
	const { moveToItems } = result.current;
	const selected = moveToItems.filter((item) => item.addon != null);
	expect(selected).toHaveLength(1);
	expect(selected[0].id).toBe('cat-a');
});

it('marks only Favorites as selected when isFavorite is true even if categoryId is also set (stale state)', () => {
	const { result } = renderHook(() => useRoomCategoryItems({ rid: 'room-1', name: 'Design Room', isFavorite: true, categoryId: 'cat-a' }), {
		wrapper,
	});
	const { moveToItems } = result.current;
	const selected = moveToItems.filter((item) => item.addon != null);
	expect(selected).toHaveLength(1);
	expect(selected[0].id).toBe('favorites');
});

it('marks nothing as selected when the room is neither favorited nor in a category', () => {
	const { result } = renderHook(() => useRoomCategoryItems({ rid: 'room-2', name: 'General', isFavorite: false }), { wrapper });
	const { moveToItems } = result.current;
	const selected = moveToItems.filter((item) => item.addon != null);
	expect(selected).toHaveLength(0);
});
