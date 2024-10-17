import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VoipTransferModal from '.';

it('should be able to select transfer target', async () => {
	const confirmFn = jest.fn();
	render(<VoipTransferModal extension='1000' onConfirm={confirmFn} onCancel={() => undefined} />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withEndpoint('GET', '/v1/users.autocomplete', () => ({
				items: [
					{
						_id: 'janedoe',
						score: 2,
						name: 'Jane Doe',
						username: 'jane.doe',
						nickname: null,
						status: 'offline',
						statusText: '',
						avatarETag: null,
					} as any,
				],
				success: true,
			}))
			.withEndpoint('GET', '/v1/users.info', () => ({
				user: {
					_id: 'pC85DQzdv8zmzXNT8',
					createdAt: '2023-04-12T18:02:08.145Z',
					username: 'jane.doe',
					emails: [
						{
							address: 'jane.doe@email.com',
							verified: true,
						},
					],
					type: 'user',
					active: true,
					roles: ['user', 'livechat-agent', 'livechat-monitor'],
					name: 'Jane Doe',
					requirePasswordChange: false,
					statusText: '',
					lastLogin: '2024-08-19T18:21:58.442Z',
					statusConnection: 'offline',
					utcOffset: -3,
					freeSwitchExtension: '1011',
					canViewAllInfo: true,
					_updatedAt: '',
				},
				success: true,
			}))
			.build(),
		legacyRoot: true,
	});
	const hangUpAnTransferButton = screen.getByRole('button', { name: 'Hang_up_and_transfer_call' });

	expect(hangUpAnTransferButton).toBeDisabled();

	screen.getByLabelText('Transfer_to').focus();
	await act(async () => {
		const userOption = await screen.findByRole('option', { name: 'Jane Doe' });
		await userEvent.click(userOption);
	});

	expect(hangUpAnTransferButton).toBeEnabled();
	hangUpAnTransferButton.click();

	expect(confirmFn).toHaveBeenCalledWith({ extension: '1011', name: 'Jane Doe' });
});

it('should call onCancel when Cancel is clicked', () => {
	const confirmFn = jest.fn();
	const cancelFn = jest.fn();
	render(<VoipTransferModal extension='1000' onConfirm={confirmFn} onCancel={cancelFn} />, {
		wrapper: mockAppRoot().build(),
		legacyRoot: true,
	});

	screen.getByText('Cancel').click();

	expect(cancelFn).toHaveBeenCalled();
});

it('should call onCancel when X is clicked', () => {
	const confirmFn = jest.fn();
	const cancelFn = jest.fn();
	render(<VoipTransferModal extension='1000' onConfirm={confirmFn} onCancel={cancelFn} />, {
		wrapper: mockAppRoot().build(),
		legacyRoot: true,
	});

	screen.getByLabelText('Close').click();

	expect(cancelFn).toHaveBeenCalled();
});
