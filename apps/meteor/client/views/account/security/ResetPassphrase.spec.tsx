import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ResetPassphrase } from './ResetPassphrase';
import { e2eSearchIndexRuntime } from '../../../lib/e2ee/rocketchat.e2e';

jest.mock('../../../lib/e2ee/rocketchat.e2e', () => ({ e2eSearchIndexRuntime: { wipe: jest.fn(async () => true) } }));

const deferred = <T,>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
};
const renderReset = (reset: () => Promise<null> = async () => null) => {
	const endpoint = jest.fn(reset);
	const logout = jest.fn(async () => undefined);
	const root = mockAppRoot()
		.withJohnDoe()
		.withLogout(logout)
		.withEndpoint('POST', '/v1/users.resetE2EKey', endpoint)
		.withTranslations('en', 'core', {
			Reset_E2EE_password: 'Reset E2EE password',
			Reset_E2EE_password_description: 'Reset the E2EE key.',
			Reset: 'Reset',
			Cancel: 'Cancel',
			Close: 'Close',
			Are_you_sure: 'Are you sure?',
		});
	const result = render(<ResetPassphrase />, { wrapper: root.build() });
	const open = async () => {
		await userEvent.click(screen.getByRole('button', { name: 'Reset E2EE password' }));
		return screen.getByRole('dialog');
	};
	return { ...result, root, endpoint, logout, open };
};

beforeEach(() => {
	jest.mocked(e2eSearchIndexRuntime.wipe).mockReset().mockResolvedValue(true);
});

it.each(['Cancel', 'Close'])('does not call the server, delete, or log out when confirmation uses %s', async (action) => {
	const { open, endpoint, logout } = renderReset();
	const dialog = await open();
	expect(endpoint).not.toHaveBeenCalled();
	expect(e2eSearchIndexRuntime.wipe).not.toHaveBeenCalled();
	await userEvent.click(within(dialog).getByRole('button', { name: action }));
	expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	expect(endpoint).not.toHaveBeenCalled();
	expect(e2eSearchIndexRuntime.wipe).not.toHaveBeenCalled();
	expect(logout).not.toHaveBeenCalled();
});

it('waits for server success before wiping and waits for the wipe before logout', async () => {
	const response = deferred<null>();
	const wiping = deferred<boolean>();
	jest.mocked(e2eSearchIndexRuntime.wipe).mockReturnValueOnce(wiping.promise);
	const { open, endpoint, logout } = renderReset(() => response.promise);
	const dialog = await open();
	await userEvent.click(within(dialog).getByRole('button', { name: 'Reset' }));
	await waitFor(() => expect(endpoint).toHaveBeenCalledTimes(1));
	expect(e2eSearchIndexRuntime.wipe).not.toHaveBeenCalled();
	expect(logout).not.toHaveBeenCalled();
	response.resolve(null);
	await waitFor(() => expect(e2eSearchIndexRuntime.wipe).toHaveBeenCalledTimes(1));
	expect(logout).not.toHaveBeenCalled();
	wiping.resolve(true);
	await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
	expect(endpoint).toHaveBeenCalledWith({});
});

it('preserves the index when the server reset fails and permits a retry', async () => {
	const { open, endpoint, logout } = renderReset();
	endpoint.mockRejectedValueOnce(new Error('reset failed'));
	await userEvent.click(within(await open()).getByRole('button', { name: 'Reset' }));
	await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	expect(e2eSearchIndexRuntime.wipe).not.toHaveBeenCalled();
	expect(logout).not.toHaveBeenCalled();
	await userEvent.click(within(await open()).getByRole('button', { name: 'Reset' }));
	await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
	expect(endpoint).toHaveBeenCalledTimes(2);
	expect(e2eSearchIndexRuntime.wipe).toHaveBeenCalledTimes(1);
});

it('prevents duplicate confirmation while reset is pending', async () => {
	const response = deferred<null>();
	const { open, endpoint, logout } = renderReset(() => response.promise);
	const dialog = await open();
	const confirm = within(dialog).getByRole('button', { name: 'Reset' });
	await userEvent.dblClick(confirm);
	await waitFor(() => expect(endpoint).toHaveBeenCalledTimes(1));
	expect(confirm).toBeDisabled();
	expect(within(dialog).queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
	response.resolve(null);
	await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
	expect(e2eSearchIndexRuntime.wipe).toHaveBeenCalledTimes(1);
});

it('keeps logout pending when index deletion fails', async () => {
	jest.mocked(e2eSearchIndexRuntime.wipe).mockRejectedValueOnce(new Error('wipe failed'));
	const { open, endpoint, logout } = renderReset();
	await userEvent.click(within(await open()).getByRole('button', { name: 'Reset' }));
	await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	expect(endpoint).toHaveBeenCalledTimes(1);
	expect(e2eSearchIndexRuntime.wipe).toHaveBeenCalledTimes(1);
	expect(logout).not.toHaveBeenCalled();
});

it.each(['confirmation', 'server'] as const)('does not delete another user after identity changes during %s', async (phase) => {
	const response = deferred<null>();
	const { open, endpoint, root, rerender, logout } = renderReset(() => response.promise);
	const dialog = await open();
	if (phase === 'server') {
		await userEvent.click(within(dialog).getByRole('button', { name: 'Reset' }));
		await waitFor(() => expect(endpoint).toHaveBeenCalledTimes(1));
	}
	root.withUser({
		_id: 'other-user',
		username: 'other-user',
		type: 'user',
		active: true,
		roles: [],
		createdAt: new Date(),
		_updatedAt: new Date(),
	});
	rerender(<ResetPassphrase />);
	if (phase === 'confirmation') await userEvent.click(within(dialog).getByRole('button', { name: 'Reset' }));
	else
		await act(async () => {
			response.resolve(null);
		});
	await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	expect(e2eSearchIndexRuntime.wipe).not.toHaveBeenCalled();
	expect(logout).not.toHaveBeenCalled();
	if (phase === 'confirmation') expect(endpoint).not.toHaveBeenCalled();
});
