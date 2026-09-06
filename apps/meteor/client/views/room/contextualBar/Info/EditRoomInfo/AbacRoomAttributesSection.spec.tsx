import type { IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';

import AbacRoomAttributesSection from './AbacRoomAttributesSection';
import { createFakeLicenseInfo, createFakeRoom } from '../../../../../../tests/mocks/data';

const room = createFakeRoom({ t: 'p' }) as IRoom;

const buildRoot = (listSpy: jest.Mock) =>
	mockAppRoot()
		.withJohnDoe()
		.withSetting('ABAC_Enabled', true)
		.withPermission('edit-room-abac-attributes')
		.withEndpoint('GET', '/v1/licenses.info', jest.fn().mockResolvedValue({ license: createFakeLicenseInfo({ activeModules: ['abac'] }) }))
		.withEndpoint('GET', '/v1/abac/attributes', listSpy)
		.withEndpoint('POST', '/v1/abac/membership-preview', jest.fn())
		.build();

describe('AbacRoomAttributesSection', () => {
	/**
	 * ABAC-P4/D12 — a room member assigns attributes out of their own entitlements, so the picker
	 * here offers only what they could be granted. The administrative Rooms tab does not pass this
	 * and keeps listing every definition (ABAC-P4/D11).
	 */
	it('asks the server for only the attributes this user could be granted', async () => {
		const listSpy = jest.fn().mockResolvedValue({ attributes: [], offset: 0, count: 0, total: 0 });

		render(<AbacRoomAttributesSection room={room} />, { wrapper: buildRoot(listSpy) });

		await waitFor(() => expect(listSpy).toHaveBeenCalled());
		expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ assignableOnly: true }));
	});

	it('renders nothing for a member without the permission to edit attributes', () => {
		const listSpy = jest.fn().mockResolvedValue({ attributes: [], offset: 0, count: 0, total: 0 });
		const wrapper = mockAppRoot()
			.withJohnDoe()
			.withSetting('ABAC_Enabled', true)
			.withEndpoint(
				'GET',
				'/v1/licenses.info',
				jest.fn().mockResolvedValue({ license: createFakeLicenseInfo({ activeModules: ['abac'] }) }),
			)
			.withEndpoint('GET', '/v1/abac/attributes', listSpy)
			.build();

		render(<AbacRoomAttributesSection room={room} />, { wrapper });

		expect(screen.queryByText('ABAC_Room_attributes_edit_hint')).not.toBeInTheDocument();
	});
});
