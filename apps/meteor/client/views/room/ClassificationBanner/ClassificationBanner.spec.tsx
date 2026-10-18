import type { IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';

import ClassificationBanner from './ClassificationBanner';
import FakeRoomProvider from '../../../../tests/mocks/client/FakeRoomProvider';

jest.mock('../../../hooks/useHasLicenseModule', () => ({
	useHasLicenseModule: () => ({ data: true }),
}));

const booleanSetting = { packageValue: false, blocked: false, public: true, type: 'boolean' as const };

const getRoomInfo = jest.fn();

const classificationBanner = {
	style: 'classic' as const,
	uppercase: true,
	monospace: false,
	text: 'UNCLASSIFIED',
	segments: [],
	backgroundColor: '#007a33',
	color: '#FFFFFF',
};

const renderBanners = (rooms: Partial<IRoom>[]) => {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

	rooms.forEach((room) =>
		render(<ClassificationBanner />, {
			wrapper: mockAppRoot()
				.withSetting('ABAC_Enabled', true, booleanSetting)
				.withSetting('ABAC_Classification_Banners_Enabled', true, booleanSetting)
				.withEndpoint('GET', '/v1/rooms.info', () => {
					getRoomInfo();
					return { room: null, classificationBanner };
				})
				.withQueryClient(queryClient)
				.wrap((children) => <FakeRoomProvider roomOverrides={room}>{children}</FakeRoomProvider>)
				.build(),
		}),
	);
};

describe('ClassificationBanner', () => {
	beforeEach(() => {
		getRoomInfo.mockClear();
	});

	it('should share one rooms.info call between rooms that are not ABAC managed and have the same shape', async () => {
		renderBanners([
			{ _id: 'dm', t: 'd' },
			{ _id: 'group-dm', t: 'd', uids: ['alice', 'bob', 'carol'] },
		]);

		await waitFor(() => expect(screen.getAllByRole('region', { name: 'ABAC_Classification_Banner' })).toHaveLength(2));
		expect(getRoomInfo).toHaveBeenCalledTimes(1);
	});

	it('should call rooms.info once per room shape', async () => {
		renderBanners([
			{ _id: 'dm', t: 'd' },
			{ _id: 'private', t: 'p' },
			{ _id: 'discussion', t: 'p', prid: 'parent' },
			{ _id: 'team-room', t: 'p', teamId: 'team' },
			{ _id: 'federated', t: 'p', federated: true },
		]);

		await waitFor(() => expect(screen.getAllByRole('region', { name: 'ABAC_Classification_Banner' })).toHaveLength(5));
		expect(getRoomInfo).toHaveBeenCalledTimes(5);
	});

	it('should call rooms.info per room for ABAC managed rooms', async () => {
		renderBanners([
			{ _id: 'abac-1', t: 'p', abacAttributes: [{ key: 'clearance', values: ['TS'] }] },
			{ _id: 'abac-2', t: 'p', abacAttributes: [{ key: 'clearance', values: ['TS'] }] },
		]);

		await waitFor(() => expect(screen.getAllByRole('region', { name: 'ABAC_Classification_Banner' })).toHaveLength(2));
		expect(getRoomInfo).toHaveBeenCalledTimes(2);
	});
});
