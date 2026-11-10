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
