import { after, before, beforeEach, describe, it, mock } from 'node:test';

import type { IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import { fn, mocked } from 'jest-mock';
import type { FunctionLike, Mocked } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../../../tests/mocks/moduleScope';

let RoomGroupingMenu: (typeof import('./RoomGroupingMenu'))['default'];
let useIsEnterprise: (typeof import('../../../../hooks/useIsEnterprise'))['useIsEnterprise'];
let useCategoryModals: (typeof import('../../../../sidebar/categories/hooks/useCategoryModals'))['useCategoryModals'];
let useMoveRoomCategory: (typeof import('../../../../sidebar/categories/hooks/useMoveRoomCategory'))['useMoveRoomCategory'];
let useUserIsSubscribed: (typeof import('../../contexts/RoomContext'))['useUserIsSubscribed'];
let useToggleFavoriteMutation: (typeof import('../../hooks/useToggleFavoriteMutation'))['useToggleFavoriteMutation'];
let mockedUseCategoryModals: Mocked<typeof useCategoryModals>;
let mockedUseMoveRoomCategory: Mocked<typeof useMoveRoomCategory>;
let mockedUseIsEnterprise: Mocked<typeof useIsEnterprise>;
let mockedUseUserIsSubscribed: Mocked<typeof useUserIsSubscribed>;
let mockedUseToggleFavoriteMutation: Mocked<typeof useToggleFavoriteMutation>;

const ROOM_ID = 'test-room-id';

const catDesign = { _id: 'cat-design', name: 'Design', showUnreads: false };
const catOther = { _id: 'cat-other', name: 'Engineering', showUnreads: false };

const makeRoom = (overrides: Partial<IRoom & { f?: boolean; category?: string }> = {}): IRoom & { f?: boolean; category?: string } =>
	({
		_id: ROOM_ID,
		name: 'General',
		t: 'c',
		...overrides,
	}) as any;

const wrapper = mockAppRoot().withSetting('Favorite_Rooms', true).withUserPreference('sidebarCategories', [catDesign, catOther]).build();

describe('RoomGroupingMenu', () => {
	before(() => {
		enterModuleScope();
		mock.module('../../../../hooks/useIsEnterprise', {
			exports: {
				useIsEnterprise: fn<FunctionLike>(),
			},
		});
		mock.module('../../../../sidebar/categories/hooks/useMoveRoomCategory', {
			exports: {
				useMoveRoomCategory: fn<FunctionLike>(),
			},
		});
		mock.module('../../../../sidebar/categories/hooks/useCategoryModals', {
			exports: {
				useCategoryModals: fn<FunctionLike>(),
			},
		});
		mock.module('../../contexts/RoomContext', {
			exports: {
				useUserIsSubscribed: fn<FunctionLike>(),
			},
		});
		mock.module('../../hooks/useToggleFavoriteMutation', {
			exports: {
				useToggleFavoriteMutation: fn<FunctionLike>(),
			},
		});
		({ default: RoomGroupingMenu } = require('./RoomGroupingMenu'));
		({ useIsEnterprise } = require('../../../../hooks/useIsEnterprise'));
		({ useCategoryModals } = require('../../../../sidebar/categories/hooks/useCategoryModals'));
		({ useMoveRoomCategory } = require('../../../../sidebar/categories/hooks/useMoveRoomCategory'));
		({ useUserIsSubscribed } = require('../../contexts/RoomContext'));
		({ useToggleFavoriteMutation } = require('../../hooks/useToggleFavoriteMutation'));
		mockedUseCategoryModals = mocked(useCategoryModals);
		mockedUseMoveRoomCategory = mocked(useMoveRoomCategory);
		mockedUseIsEnterprise = mocked(useIsEnterprise);
		mockedUseUserIsSubscribed = mocked(useUserIsSubscribed);
		mockedUseToggleFavoriteMutation = mocked(useToggleFavoriteMutation);
	});

	after(leaveModuleScope);

	beforeEach(() => {
		mockedUseUserIsSubscribed.mockReturnValue(true);
		mockedUseToggleFavoriteMutation.mockReturnValue({ mutate: fn<FunctionLike>() } as any);
		mockedUseCategoryModals.mockReturnValue({
			openCreate: fn<FunctionLike>(),
			openManage: fn<FunctionLike>(),
			openDelete: fn<FunctionLike>(),
		});
		mockedUseMoveRoomCategory.mockReturnValue({ mutate: fn<FunctionLike>(), mutateAsync: fn<FunctionLike>() } as any);
		mockedUseIsEnterprise.mockReturnValue({ data: { isEnterprise: true } } as any);
	});

	it('shows Favorites in the grouping menu when the room is favorited', async () => {
		render(<RoomGroupingMenu room={makeRoom({ f: true })} />, { wrapper });

		await userEvent.click(screen.getByRole('button'));

		expect(await screen.findByRole('menuitem', { name: 'Favorites' })).toBeInTheDocument();
	});

	it('shows the matching category in the grouping menu when the room has a category subscription field', async () => {
		render(<RoomGroupingMenu room={makeRoom({ f: false, category: 'cat-design' })} />, { wrapper });

		await userEvent.click(screen.getByRole('button'));

		expect(await screen.findByRole('menuitem', { name: 'Design' })).toBeInTheDocument();
	});
});
