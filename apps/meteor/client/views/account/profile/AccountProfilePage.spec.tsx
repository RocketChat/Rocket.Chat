import { mockAppRoot } from '@rocket.chat/mock-providers';
import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AccountProfilePage from './AccountProfilePage';

const renderPage = ({ withUser = true } = {}) => {
	const updateOwnBasicInfo = jest.fn(() => ({ user: {} as any }));
	const setStatus = jest.fn(() => null as any);
	const resetAvatar = jest.fn(() => null as any);

	const root = mockAppRoot();
	if (withUser) {
		root.withJohnDoe({
			emails: [{ address: 'john.doe@example.com', verified: true }],
			nickname: 'Johnny',
			bio: 'Old bio',
		});
	}

	render(<AccountProfilePage />, {
		wrapper: root
			.withEndpoint('POST', '/v1/users.updateOwnBasicInfo', updateOwnBasicInfo)
			.withEndpoint('POST', '/v1/users.setStatus', setStatus)
			.withEndpoint('POST', '/v1/users.resetAvatar', resetAvatar)
			.withEndpoint('GET', '/v1/users.checkUsernameAvailability', () => ({ result: true }))
			.withTranslations('en', 'core', {
				Name: 'Name',
				Status: 'Status',
				Save_changes: 'Save changes',
				Profile_saved_successfully: 'Profile saved successfully',
			})
			.build(),
	});

	return { updateOwnBasicInfo, setStatus, resetAvatar };
};

it('should not send identity fields when only the status changes', async () => {
	const { updateOwnBasicInfo, setStatus } = renderPage();

	await userEvent.type(screen.getByRole('textbox', { name: 'Status' }), 'Out for lunch');
	await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

	await waitFor(() => expect(setStatus).toHaveBeenCalled());
	expect(setStatus).toHaveBeenCalledWith({ status: 'online', message: 'Out for lunch' });
	expect(updateOwnBasicInfo).not.toHaveBeenCalled();
});

it('should send only the fields the user changed', async () => {
	const { updateOwnBasicInfo } = renderPage();

	const nameInput = screen.getByRole('textbox', { name: /Name/ });
	await userEvent.clear(nameInput);
	await userEvent.type(nameInput, 'Jane Doe');
	await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

	await waitFor(() => expect(updateOwnBasicInfo).toHaveBeenCalledTimes(1));
	expect(updateOwnBasicInfo).toHaveBeenCalledWith({ data: { name: 'Jane Doe' } });
});

it('refreshes the user views after an avatar-only save, once the avatar is updated', async () => {
	const calls: string[] = [];
	const invalidateQueries = jest.spyOn(QueryClient.prototype, 'invalidateQueries').mockImplementation(async () => {
		calls.push('invalidate');
	});
	const { updateOwnBasicInfo, resetAvatar } = renderPage();
	resetAvatar.mockImplementation(() => {
		calls.push('resetAvatar');
		return null;
	});

	await userEvent.click(screen.getByTitle('Accounts_SetDefaultAvatar'));
	await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

	await waitFor(() => expect(invalidateQueries).toHaveBeenCalled());
	expect(calls[0]).toBe('resetAvatar');
	expect(updateOwnBasicInfo).not.toHaveBeenCalled();
	invalidateQueries.mockRestore();
});

it('sends a typed email even before the user record resolves', async () => {
	const { updateOwnBasicInfo } = renderPage({ withUser: false });

	await userEvent.type(screen.getByRole('textbox', { name: /^Name/ }), 'Jane Doe');
	await userEvent.type(screen.getByRole('textbox', { name: /Username/ }), 'jane');
	await userEvent.type(screen.getByRole('textbox', { name: /Email/ }), 'jane@example.com');
	await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

	await waitFor(() => expect(updateOwnBasicInfo).toHaveBeenCalledTimes(1));
	expect(updateOwnBasicInfo).toHaveBeenCalledWith({ data: expect.objectContaining({ email: 'jane@example.com' }) });
});
