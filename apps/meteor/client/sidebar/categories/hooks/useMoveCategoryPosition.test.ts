import { after, before, beforeEach, describe, it, mock } from 'node:test';

import { renderHook, act } from '@testing-library/react';
import { expect } from 'expect';
import { fn, mocked } from 'jest-mock';
import type { FunctionLike, Mocked } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../../tests/mocks/moduleScope';

let useUserPreference: (typeof import('@rocket.chat/ui-contexts'))['useUserPreference'];
let useMoveCategoryPosition: (typeof import('./useMoveCategoryPosition'))['useMoveCategoryPosition'];
let usePersistCategoriesMutation: (typeof import('./usePersistCategoriesMutation'))['usePersistCategoriesMutation'];
let useUserSidebarCategories: (typeof import('./useUserSidebarCategories'))['useUserSidebarCategories'];
let SIDEBAR_DYNAMIC_GROUP_KEYS: (typeof import('../../hooks/useCategoryList'))['SIDEBAR_DYNAMIC_GROUP_KEYS'];
let mockedUseUserPreference: Mocked<typeof useUserPreference>;
let mockedUsePersistCategoriesMutation: Mocked<typeof usePersistCategoriesMutation>;
let mockedUseUserSidebarCategories: Mocked<typeof useUserSidebarCategories>;

const mutateAsync = fn<FunctionLike>().mockResolvedValue(undefined);

const persistedIds = (): string[] => mutateAsync.mock.calls[0][0].map((c: { _id: string }) => c._id);

describe('useMoveCategoryPosition', () => {
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('@rocket.chat/ui-contexts'), {
			exports: {
				useUserPreference: fn<FunctionLike>(),
			},
		});
		mock.module('./usePersistCategoriesMutation', {
			exports: {
				usePersistCategoriesMutation: fn<FunctionLike>(),
			},
		});
		mock.module('./useUserSidebarCategories', {
			exports: {
				useUserSidebarCategories: fn<FunctionLike>(),
			},
		});
		({ useUserPreference } = require('@rocket.chat/ui-contexts'));
		({ useMoveCategoryPosition } = require('./useMoveCategoryPosition'));
		({ usePersistCategoriesMutation } = require('./usePersistCategoriesMutation'));
		({ useUserSidebarCategories } = require('./useUserSidebarCategories'));
		({ SIDEBAR_DYNAMIC_GROUP_KEYS } = require('../../hooks/useCategoryList'));
		mockedUseUserPreference = mocked(useUserPreference);
		mockedUsePersistCategoriesMutation = mocked(usePersistCategoriesMutation);
		mockedUseUserSidebarCategories = mocked(useUserSidebarCategories);
	});

	after(leaveModuleScope);

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
});
