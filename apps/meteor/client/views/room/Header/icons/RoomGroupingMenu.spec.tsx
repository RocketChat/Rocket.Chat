import type { IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RoomGroupingMenu from './RoomGroupingMenu';
import { useCategoryModals } from '../../../../sidebar/categories/useCategoryModals';
import { useCustomCategories } from '../../../../sidebar/hooks/useCustomCategories';
import { useUserIsSubscribed } from '../../contexts/RoomContext';
import { useToggleFavoriteMutation } from '../../hooks/useToggleFavoriteMutation';

jest.mock('../../../../sidebar/hooks/useCustomCategories', () => ({ useCustomCategories: jest.fn(), FAVORITES_TARGET: 'favorites' }));
jest.mock('../../../../sidebar/categories/useCategoryModals', () => ({ useCategoryModals: jest.fn() }));
jest.mock('../../contexts/RoomContext', () => ({ useUserIsSubscribed: jest.fn() }));
jest.mock('../../hooks/useToggleFavoriteMutation', () => ({ useToggleFavoriteMutation: jest.fn() }));

const mockedUseCustomCategories = jest.mocked(useCustomCategories);
const mockedUseCategoryModals = jest.mocked(useCategoryModals);
const mockedUseUserIsSubscribed = jest.mocked(useUserIsSubscribed);
const mockedUseToggleFavoriteMutation = jest.mocked(useToggleFavoriteMutation);

const ROOM_ID = 'test-room-id';

const catDesign = { _id: 'cat-design', name: 'Design', showUnreads: true };
const catOther = { _id: 'cat-other', name: 'Engineering', showUnreads: true };

const makeRoom = (overrides: Partial<IRoom & { f?: boolean; category?: string }> = {}): IRoom & { f?: boolean; category?: string } =>
	({ _id: ROOM_ID, name: 'General', t: 'c', ...overrides }) as any;

const wrapper = mockAppRoot().withSetting('Favorite_Rooms', true).build();

beforeEach(() => {
	mockedUseUserIsSubscribed.mockReturnValue(true);
	mockedUseToggleFavoriteMutation.mockReturnValue({ mutate: jest.fn() } as any);
	mockedUseCategoryModals.mockReturnValue({ openCreate: jest.fn(), openManage: jest.fn(), openDelete: jest.fn() });
});

it('shows Favorites in the grouping menu when the room is favorited', async () => {
	mockedUseCustomCategories.mockReturnValue({
		hasLicenseModule: true,
		categories: [catDesign, catOther],
	} as any);

	render(<RoomGroupingMenu room={makeRoom({ f: true })} />, { wrapper });

	await userEvent.click(screen.getByRole('button'));

	expect(await screen.findByRole('menuitem', { name: 'Favorites' })).toBeInTheDocument();
});

it('shows the matching category in the grouping menu when the room has a category subscription field', async () => {
	mockedUseCustomCategories.mockReturnValue({
		hasLicenseModule: true,
		categories: [catDesign, catOther],
	} as any);

	render(<RoomGroupingMenu room={makeRoom({ f: false, category: 'cat-design' })} />, { wrapper });

	await userEvent.click(screen.getByRole('button'));

	expect(await screen.findByRole('menuitem', { name: 'Design' })).toBeInTheDocument();
});
