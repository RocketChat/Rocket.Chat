import type { IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';

import AbacRoomAttributesSection from './AbacRoomAttributesSection';
import { createFakeLicenseInfo, createFakeRoom } from '../../../../../../tests/mocks/data';

const room = createFakeRoom({ t: 'p' }) as IRoom;

const buildRoot = (listSpy: jest.Mock, { enforced = false } = {}) =>
	mockAppRoot()
		.withJohnDoe()
		.withSetting('ABAC_Enabled', true)
		.withSetting('ABAC_Enforce_All_Rooms', enforced)
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

	/**
	 * ABAC-P4 QA — clearing the last attribute is how a room stops being ABAC-managed, so with
	 * enforcement off the first row has to be removable. With enforcement on it must not be: every
	 * room has to stay ABAC-managed.
	 */
	describe('removing the last attribute', () => {
		const roomWithAttribute = { ...room, abacAttributes: [{ key: 'clearance', values: ['secret'] }] } as IRoom;

		it('offers to remove the only attribute while enforcement is off', async () => {
			const listSpy = jest.fn().mockResolvedValue({ attributes: [], offset: 0, count: 0, total: 0 });

			render(<AbacRoomAttributesSection room={roomWithAttribute} />, { wrapper: buildRoot(listSpy, { enforced: false }) });

			expect(await screen.findByRole('button', { name: 'Remove' })).toBeInTheDocument();
		});

		it('does not offer to remove the only attribute while enforcement is on', async () => {
			const listSpy = jest.fn().mockResolvedValue({ attributes: [], offset: 0, count: 0, total: 0 });

			render(<AbacRoomAttributesSection room={roomWithAttribute} />, { wrapper: buildRoot(listSpy, { enforced: true }) });

			await waitFor(() => expect(listSpy).toHaveBeenCalled());
			expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
		});
	});
});
