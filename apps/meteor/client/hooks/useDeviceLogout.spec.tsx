import { mockAppRoot } from '@rocket.chat/mock-providers';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useDeviceLogout } from './useDeviceLogout';

const SESSION_ID = 'session-id';

type Endpoint = '/v1/sessions/logout' | '/v1/sessions/logout.me';

const setup = ({
	isCurrentSession,
	endpoint,
	shouldFail = false,
	openContextualBar = false,
}: {
	isCurrentSession?: boolean;
	endpoint: Endpoint;
	shouldFail?: boolean;
	openContextualBar?: boolean;
}) => {
	const dispatchToastMessage = jest.fn();
	const logout = jest.fn(() => Promise.resolve());
	const navigate = jest.fn();
	const logoutEndpoint = jest.fn(() => {
		if (shouldFail) {
			throw new Error('logout failed');
		}
		return { sessionId: SESSION_ID };
	});

	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries');

	let builder = mockAppRoot()
		.withQueryClient(queryClient)
		.withEndpoint('POST', endpoint, logoutEndpoint)
		.withRouter({ navigate })
		.withToastMessageDispatch(dispatchToastMessage)
		.withLogout(logout);

	// `isContextualBarOpen` is derived from the `id` route param matching the session id.
	if (openContextualBar) {
		builder = builder.withRouteParameter('id', SESSION_ID);
	}

	const { result } = renderHook(() => useDeviceLogout(SESSION_ID, endpoint, isCurrentSession), { wrapper: builder.build() });

	return { result, dispatchToastMessage, logout, navigate, logoutEndpoint, invalidateQueries };
};

const openModalAndConfirm = async (openLogoutModal: () => void) => {
	act(() => {
		openLogoutModal();
	});

	const confirmButton = screen.getByRole('button', { name: 'Logout_Device' });
	await userEvent.click(confirmButton);
};

describe('useDeviceLogout', () => {
	it('should open a confirmation modal when the returned callback is invoked', () => {
		const { result } = setup({ endpoint: '/v1/sessions/logout' });

		expect(screen.queryByRole('button', { name: 'Logout_Device' })).not.toBeInTheDocument();

		act(() => {
			result.current();
		});

		expect(screen.getByRole('button', { name: 'Logout_Device' })).toBeInTheDocument();
	});

	describe('for another session', () => {
		it('should log the device out, show a success toast and close the modal on success', async () => {
			const { result, dispatchToastMessage, logout, invalidateQueries } = setup({ endpoint: '/v1/sessions/logout' });

			await openModalAndConfirm(result.current);

			await waitFor(() => {
				expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'success', message: 'Device_Logged_Out' });
			});
			expect(invalidateQueries).toHaveBeenCalled();
			expect(logout).not.toHaveBeenCalled();

			await waitFor(() => {
				expect(screen.queryByRole('button', { name: 'Logout_Device' })).not.toBeInTheDocument();
			});
		});

		it('should call the endpoint with the session id', async () => {
			const { result, logoutEndpoint } = setup({ endpoint: '/v1/sessions/logout' });

			await openModalAndConfirm(result.current);

			await waitFor(() => {
				expect(logoutEndpoint).toHaveBeenCalledWith({ sessionId: SESSION_ID });
			});
		});

		it('should close the contextual bar when it is open for the logged out session', async () => {
			const { result, navigate } = setup({ endpoint: '/v1/sessions/logout', openContextualBar: true });

			await openModalAndConfirm(result.current);

			await waitFor(() => {
				expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ name: 'device-management', params: {} }), expect.anything());
			});
		});

		it('should show an error toast and close the modal on failure, without a success toast', async () => {
			const { result, dispatchToastMessage, logout, invalidateQueries } = setup({
				endpoint: '/v1/sessions/logout',
				shouldFail: true,
			});

			await openModalAndConfirm(result.current);

			await waitFor(() => {
				expect(dispatchToastMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
			});
			expect(dispatchToastMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
			expect(invalidateQueries).not.toHaveBeenCalled();
			expect(logout).not.toHaveBeenCalled();

			await waitFor(() => {
				expect(screen.queryByRole('button', { name: 'Logout_Device' })).not.toBeInTheDocument();
			});
		});
	});

	describe('for the current session', () => {
		it('should log the user out and close the modal on success, without any toast', async () => {
			const { result, dispatchToastMessage, logout } = setup({
				endpoint: '/v1/sessions/logout.me',
				isCurrentSession: true,
			});

			await openModalAndConfirm(result.current);

			await waitFor(() => {
				expect(logout).toHaveBeenCalledTimes(1);
			});
			expect(dispatchToastMessage).not.toHaveBeenCalled();

			await waitFor(() => {
				expect(screen.queryByRole('button', { name: 'Logout_Device' })).not.toBeInTheDocument();
			});
		});

		it('should still log the user out and close the modal on failure, without any toast', async () => {
			const { result, dispatchToastMessage, logout } = setup({
				endpoint: '/v1/sessions/logout.me',
				isCurrentSession: true,
				shouldFail: true,
			});

			await openModalAndConfirm(result.current);

			await waitFor(() => {
				expect(logout).toHaveBeenCalledTimes(1);
			});
			expect(dispatchToastMessage).not.toHaveBeenCalled();

			await waitFor(() => {
				expect(screen.queryByRole('button', { name: 'Logout_Device' })).not.toBeInTheDocument();
			});
		});
	});
});
