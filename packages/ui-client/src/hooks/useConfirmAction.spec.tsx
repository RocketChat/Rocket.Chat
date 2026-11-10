import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Suspense } from 'react';

import { useConfirmAction } from './useConfirmAction';
import ModalProviderWithRegion from '../providers/ModalProvider/ModalProviderWithRegion';

const renderConfirmAction = (action: (id: string) => Promise<unknown>) => {
	const dispatch = jest.fn();

	const { result } = renderHook(() => useConfirmAction(action, { successMessage: 'Removed' }), {
		wrapper: mockAppRoot()
			.withToastMessageDispatch(dispatch)
			.wrap((children) => (
				<Suspense fallback={null}>
					<ModalProviderWithRegion>{children}</ModalProviderWithRegion>
				</Suspense>
			))
			.build(),
	});

	act(() => result.current('some-id'));

	return { dispatch };
};

it('should not run the action until the user confirms', async () => {
	const action = jest.fn().mockResolvedValue(undefined);
	renderConfirmAction(action);

	expect(await screen.findByRole('dialog')).toBeInTheDocument();
	expect(action).not.toHaveBeenCalled();
});

it('should run the action, dispatch a success toast and close the modal on confirm', async () => {
	const action = jest.fn().mockResolvedValue(undefined);
	const { dispatch } = renderConfirmAction(action);

	await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));

	expect(action).toHaveBeenCalledWith('some-id');
	expect(dispatch).toHaveBeenCalledWith({ type: 'success', message: 'Removed' });
	await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

it('should dispatch an error toast and close the modal when the action fails', async () => {
	const error = new Error('failed');
	const action = jest.fn().mockRejectedValue(error);
	const { dispatch } = renderConfirmAction(action);

	await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));

	expect(dispatch).toHaveBeenCalledWith({ type: 'error', message: error });
	expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
	await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

it('should close the modal without running the action on cancel', async () => {
	const action = jest.fn().mockResolvedValue(undefined);
	const { dispatch } = renderConfirmAction(action);

	await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

	expect(action).not.toHaveBeenCalled();
	expect(dispatch).not.toHaveBeenCalled();
	await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

it('should run the action only once when confirm is clicked repeatedly while pending', async () => {
	const { promise, resolve } = Promise.withResolvers<void>();
	const action = jest.fn(() => promise);
	const { dispatch } = renderConfirmAction(action);

	const confirm = await screen.findByRole('button', { name: 'Delete' });
	await userEvent.click(confirm);
	await userEvent.click(confirm);

	expect(action).toHaveBeenCalledTimes(1);

	await act(async () => resolve());

	expect(dispatch).toHaveBeenCalledTimes(1);
	await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

it('should keep the modal open while the action is pending', async () => {
	const { promise, resolve } = Promise.withResolvers<void>();
	const action = jest.fn(() => promise);
	renderConfirmAction(action);

	await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));

	expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
	await userEvent.click(screen.getByRole('button', { name: 'Close' }));
	expect(screen.getByRole('dialog')).toBeInTheDocument();

	await act(async () => resolve());

	await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});
