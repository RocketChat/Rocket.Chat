import { after, before, beforeEach, describe, it, mock } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';
import { expect } from 'expect';
import { fn, mocked } from 'jest-mock';
import type { FunctionLike, Mocked } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../../tests/mocks/moduleScope';

let useCategoryModals: (typeof import('./useCategoryModals'))['useCategoryModals'];
let useMoveRoomCategory: (typeof import('./useMoveRoomCategory'))['useMoveRoomCategory'];
let useRoomCategoryItems: (typeof import('./useRoomCategoryItems'))['useRoomCategoryItems'];
let useUserSidebarCategories: (typeof import('./useUserSidebarCategories'))['useUserSidebarCategories'];
let useIsEnterprise: (typeof import('../../../hooks/useIsEnterprise'))['useIsEnterprise'];
let mockedUseCustomCategories: Mocked<typeof useUserSidebarCategories>;
let mockedUseMoveRoomCategory: Mocked<typeof useMoveRoomCategory>;
let mockedUseCategoryModals: Mocked<typeof useCategoryModals>;
let mockedUseIsEnterprise: Mocked<typeof useIsEnterprise>;

const catA = { _id: 'cat-a', name: 'Design', showUnreads: true };
const catB = { _id: 'cat-b', name: 'Engineering', showUnreads: true };

const wrapper = mockAppRoot().withSetting('Favorite_Rooms', true).build();

describe('useRoomCategoryItems', () => {
	before(() => {
		enterModuleScope();
		mock.module('./useUserSidebarCategories', {
			exports: {
				useUserSidebarCategories: fn<FunctionLike>(),
				FAVORITES_TARGET: 'favorites',
			},
		});
		mock.module('./useMoveRoomCategory', {
			exports: {
				useMoveRoomCategory: fn<FunctionLike>(),
			},
		});
		mock.module('./useCategoryModals', {
			exports: {
				useCategoryModals: fn<FunctionLike>(),
			},
		});
		mock.module('../../../hooks/useIsEnterprise', {
			exports: {
				useIsEnterprise: fn<FunctionLike>(),
			},
		});
		({ useCategoryModals } = require('./useCategoryModals'));
		({ useMoveRoomCategory } = require('./useMoveRoomCategory'));
		({ useRoomCategoryItems } = require('./useRoomCategoryItems'));
		({ useUserSidebarCategories } = require('./useUserSidebarCategories'));
		({ useIsEnterprise } = require('../../../hooks/useIsEnterprise'));
		mockedUseCustomCategories = mocked(useUserSidebarCategories);
		mockedUseMoveRoomCategory = mocked(useMoveRoomCategory);
		mockedUseCategoryModals = mocked(useCategoryModals);
		mockedUseIsEnterprise = mocked(useIsEnterprise);
	});

	after(leaveModuleScope);

	beforeEach(() => {
		mockedUseCustomCategories.mockReturnValue({ customCategories: [catA, catB] } as any);
		mockedUseMoveRoomCategory.mockReturnValue({ mutate: fn<FunctionLike>(), mutateAsync: fn<FunctionLike>() } as any);
		mockedUseCategoryModals.mockReturnValue({
			openCreate: fn<FunctionLike>(),
			openManage: fn<FunctionLike>(),
			openDelete: fn<FunctionLike>(),
		});
		mockedUseIsEnterprise.mockReturnValue({ data: { isEnterprise: true } } as any);
	});

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
		const { result } = renderHook(
			() => useRoomCategoryItems({ rid: 'room-1', name: 'Design Room', isFavorite: true, categoryId: 'cat-a' }),
			{
				wrapper,
			},
		);
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

	it('offers creating a new category on an enterprise workspace', () => {
		const { result } = renderHook(() => useRoomCategoryItems({ rid: 'room-2', name: 'General', isFavorite: false }), { wrapper });
		expect(result.current.moveToItems.map(({ id }) => id)).toContain('newCategory');
	});

	it('does not offer creating a new category on a non-enterprise workspace', () => {
		mockedUseIsEnterprise.mockReturnValue({ data: { isEnterprise: false } } as any);
		const { result } = renderHook(() => useRoomCategoryItems({ rid: 'room-2', name: 'General', isFavorite: false }), { wrapper });
		expect(result.current.moveToItems.map(({ id }) => id)).not.toContain('newCategory');
	});
});
