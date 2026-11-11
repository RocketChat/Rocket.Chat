import type { IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ClassificationBanner from './ClassificationBanner';
import FakeRoomProvider from '../../../../tests/mocks/client/FakeRoomProvider';

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

const renderBanner = (room: Partial<IRoom>, bannersEnabled: boolean) =>
	render(<ClassificationBanner />, {
		wrapper: mockAppRoot()
			.withSetting('ABAC_Classification_Banners_Enabled', bannersEnabled, booleanSetting)
			.withEndpoint('GET', '/v1/rooms.info', () => {
				getRoomInfo();
				return { room: null, classificationBanner };
			})
			.wrap((children) => <FakeRoomProvider roomOverrides={room}>{children}</FakeRoomProvider>)
			.build(),
	});

describe('ClassificationBanner', () => {
	beforeEach(() => {
		getRoomInfo.mockClear();
	});

	it('should render the banner rooms.info returns for a room that is not ABAC managed', async () => {
		renderBanner({ _id: 'dm', t: 'd' }, true);

		expect(await screen.findByRole('region', { name: 'ABAC_Classification_Banner' })).toHaveTextContent('UNCLASSIFIED');
	});

	it('should not call rooms.info or render a banner while classification banners are disabled', () => {
		renderBanner({ _id: 'dm', t: 'd' }, false);

		expect(screen.queryByRole('region', { name: 'ABAC_Classification_Banner' })).not.toBeInTheDocument();
		expect(getRoomInfo).not.toHaveBeenCalled();
	});
});
