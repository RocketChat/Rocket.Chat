import { useUserPreference } from '@rocket.chat/ui-contexts';
import { renderHook, act } from '@testing-library/react';

import { useMoveCategoryPosition } from './useMoveCategoryPosition';
import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useUserSidebarCategories } from './useUserSidebarCategories';
import { SIDEBAR_DYNAMIC_GROUP_KEYS } from '../../hooks/useCategoryList';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useUserPreference: jest.fn(),
}));

jest.mock('./usePersistCategoriesMutation', () => ({
	usePersistCategoriesMutation: jest.fn(),
}));

jest.mock('./useUserSidebarCategories', () => ({
	useUserSidebarCategories: jest.fn(),
}));

const mockedUseUserPreference = jest.mocked(useUserPreference);
const mockedUsePersistCategoriesMutation = jest.mocked(usePersistCategoriesMutation);
const mockedUseUserSidebarCategories = jest.mocked(useUserSidebarCategories);

const mutateAsync = jest.fn().mockResolvedValue(undefined);

const persistedIds = (): string[] => mutateAsync.mock.calls[0][0].map((c: { _id: string }) => c._id);

beforeEach(() => {
	mutateAsync.mockClear();
	mockedUseUserPreference.mockReturnValue(undefined); // sidebarSectionsOrder falls back to SIDEBAR_SYSTEM_GROUP_KEYS
	mockedUsePersistCategoriesMutation.mockReturnValue({ mutateAsync } as any);
	mockedUseUserSidebarCategories.mockReturnValue({ rawCategories: [], customCategories: [] });
});

it('moves a group down by swapping with its adjacent neighbour', async () => {
	const { result } = renderHook(() => useMoveCategoryPosition());

	await act(async () => {
		await result.current(['Favorites', 'Channels'], 'Favorites', 'down');
	});

	const ids = persistedIds();
	expect(ids.indexOf('Channels')).toBeLessThan(ids.indexOf('Favorites'));
});

it('moves a group up by swapping with its adjacent neighbour', async () => {
	const { result } = renderHook(() => useMoveCategoryPosition());

	await act(async () => {
		await result.current(['Favorites', 'Channels'], 'Channels', 'up');
	});

	const ids = persistedIds();
	expect(ids.indexOf('Channels')).toBeLessThan(ids.indexOf('Favorites'));
});

it('does nothing when the group is already at the top and moving up', async () => {
	const { result } = renderHook(() => useMoveCategoryPosition());

	await act(async () => {
		await result.current(['Favorites', 'Channels'], 'Favorites', 'up');
	});

	expect(mutateAsync).not.toHaveBeenCalled();
});

it('does nothing when the group is already at the bottom and moving down', async () => {
	const { result } = renderHook(() => useMoveCategoryPosition());

	await act(async () => {
		await result.current(['Favorites', 'Channels'], 'Channels', 'down');
	});

	expect(mutateAsync).not.toHaveBeenCalled();
});

it('does nothing when the key is not found in currentKeys', async () => {
	const { result } = renderHook(() => useMoveCategoryPosition());

	await act(async () => {
		await result.current(['Favorites', 'Channels'], 'Teams', 'down');
	});

	expect(mutateAsync).not.toHaveBeenCalled();
});

it('always places dynamic groups before static groups in the persisted result', async () => {
	const { result } = renderHook(() => useMoveCategoryPosition());

	await act(async () => {
		await result.current(['Favorites', 'Channels'], 'Favorites', 'down');
	});

	const ids = persistedIds();
	const lastDynamicIdx = Math.max(...SIDEBAR_DYNAMIC_GROUP_KEYS.map((k) => ids.indexOf(k)));
	const firstStaticIdx = ids.indexOf('Channels'); // first static key in result
	expect(lastDynamicIdx).toBeLessThan(firstStaticIdx);
});

it('persists existing category entries with their stored metadata', async () => {
	const stored = [{ _id: 'Favorites', name: 'Favorites', default: true, showUnreads: true }];
	mockedUseUserSidebarCategories.mockReturnValue({ rawCategories: stored, customCategories: [] });

	const { result } = renderHook(() => useMoveCategoryPosition());

	await act(async () => {
		await result.current(['Favorites', 'Channels'], 'Favorites', 'down');
	});

	const persisted: { _id: string; showUnreads?: boolean }[] = mutateAsync.mock.calls[0][0];
	const favEntry = persisted.find((e) => e._id === 'Favorites');
	expect(favEntry?.showUnreads).toBe(true);
});
