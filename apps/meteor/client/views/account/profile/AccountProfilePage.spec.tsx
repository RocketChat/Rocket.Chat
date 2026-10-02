import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AccountProfilePage from './AccountProfilePage';

const renderPage = () => {
	const updateOwnBasicInfo = jest.fn(() => ({ user: {} as any }));
	const setStatus = jest.fn(() => null as any);

	render(<AccountProfilePage />, {
		wrapper: mockAppRoot()
			.withJohnDoe({
				emails: [{ address: 'john.doe@example.com', verified: true }],
				nickname: 'Johnny',
				bio: 'Old bio',
			})
			.withEndpoint('POST', '/v1/users.updateOwnBasicInfo', updateOwnBasicInfo)
			.withEndpoint('POST', '/v1/users.setStatus', setStatus)
			.withTranslations('en', 'core', {
				Name: 'Name',
				Status: 'Status',
				Save_changes: 'Save changes',
				Profile_saved_successfully: 'Profile saved successfully',
			})
			.build(),
	});

	return { updateOwnBasicInfo, setStatus };
};

it('should not send identity fields when only the status changes', async () => {
	const { updateOwnBasicInfo, setStatus } = renderPage();

	await userEvent.type(screen.getByRole('textbox', { name: 'Status' }), 'Out for lunch');
	await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

	await waitFor(() => expect(setStatus).toHaveBeenCalled());
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
