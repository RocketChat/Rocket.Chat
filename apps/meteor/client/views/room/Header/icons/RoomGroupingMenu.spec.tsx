import type { IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RoomGroupingMenu from './RoomGroupingMenu';
import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';
import { useCategoryModals } from '../../../../sidebar/categories/hooks/useCategoryModals';
import { useMoveRoomCategory } from '../../../../sidebar/categories/hooks/useMoveRoomCategory';
import { useUserIsSubscribed } from '../../contexts/RoomContext';
import { useToggleFavoriteMutation } from '../../hooks/useToggleFavoriteMutation';

jest.mock('../../../../hooks/useHasLicenseModule', () => ({ useHasLicenseModule: jest.fn() }));
jest.mock('../../../../sidebar/categories/hooks/useMoveRoomCategory', () => ({ useMoveRoomCategory: jest.fn() }));
jest.mock('../../../../sidebar/categories/hooks/useCategoryModals', () => ({ useCategoryModals: jest.fn() }));
jest.mock('../../contexts/RoomContext', () => ({ useUserIsSubscribed: jest.fn() }));
jest.mock('../../hooks/useToggleFavoriteMutation', () => ({ useToggleFavoriteMutation: jest.fn() }));

const mockedUseCategoryModals = jest.mocked(useCategoryModals);
const mockedUseMoveRoomCategory = jest.mocked(useMoveRoomCategory);
const mockedUseHasLicenseModule = jest.mocked(useHasLicenseModule);
const mockedUseUserIsSubscribed = jest.mocked(useUserIsSubscribed);
const mockedUseToggleFavoriteMutation = jest.mocked(useToggleFavoriteMutation);

const ROOM_ID = 'test-room-id';

const catDesign = { _id: 'cat-design', name: 'Design', showUnreads: false };
const catOther = { _id: 'cat-other', name: 'Engineering', showUnreads: false };

const makeRoom = (overrides: Partial<IRoom & { f?: boolean; category?: string }> = {}): IRoom & { f?: boolean; category?: string } =>
	({ _id: ROOM_ID, name: 'General', t: 'c', ...overrides }) as any;

const wrapper = mockAppRoot().withSetting('Favorite_Rooms', true).withUserPreference('sidebarCategories', [catDesign, catOther]).build();

beforeEach(() => {
	mockedUseUserIsSubscribed.mockReturnValue(true);
	mockedUseToggleFavoriteMutation.mockReturnValue({ mutate: jest.fn() } as any);
	mockedUseCategoryModals.mockReturnValue({ openCreate: jest.fn(), openManage: jest.fn(), openDelete: jest.fn() });
	mockedUseMoveRoomCategory.mockReturnValue({ mutate: jest.fn(), mutateAsync: jest.fn() } as any);
	mockedUseHasLicenseModule.mockReturnValue({ data: true } as any);
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
