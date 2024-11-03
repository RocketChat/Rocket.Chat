import { useSetModal } from '@rocket.chat/ui-contexts';
import { act, screen, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import React, { Suspense } from 'react';

import ModalProviderWithRegion from '../../providers/ModalProvider/ModalProviderWithRegion';
import GenericModal from './GenericModal';

const renderModal = (modalElement: ReactElement) => {
	const {
		result: { current: setModal },
	} = renderHook(() => useSetModal(), {
		legacyRoot: true,
		wrapper: ({ children }) => (
			<Suspense fallback={null}>
				<ModalProviderWithRegion>{children}</ModalProviderWithRegion>
			</Suspense>
		),
	});

	act(() => {
		setModal(modalElement);
	});

	return { setModal };
};

describe('callbacks', () => {
	it('should call onClose callback when dismissed', async () => {
		const handleClose = jest.fn();

		renderModal(<GenericModal title='Modal' onClose={handleClose} />);

		expect(await screen.findByRole('heading', { name: 'Modal' })).toBeInTheDocument();

		await userEvent.keyboard('{Escape}');

		expect(screen.queryByRole('heading', { name: 'Modal' })).not.toBeInTheDocument();

		expect(handleClose).toHaveBeenCalled();
	});

	it('should NOT call onClose callback when confirmed', async () => {
		const handleConfirm = jest.fn();
		const handleClose = jest.fn();

		const { setModal } = renderModal(<GenericModal title='Modal' onConfirm={handleConfirm} onClose={handleClose} />);

		expect(await screen.findByRole('heading', { name: 'Modal' })).toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: 'Ok' }));

		expect(handleConfirm).toHaveBeenCalled();

		act(() => {
			setModal(null);
		});

		expect(screen.queryByRole('heading', { name: 'Modal' })).not.toBeInTheDocument();

		expect(handleClose).not.toHaveBeenCalled();
	});

	it('should NOT call onClose callback when cancelled', async () => {
		const handleCancel = jest.fn();
		const handleClose = jest.fn();

		const { setModal } = renderModal(<GenericModal title='Modal' onCancel={handleCancel} onClose={handleClose} />);

		expect(await screen.findByRole('heading', { name: 'Modal' })).toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(handleCancel).toHaveBeenCalled();

		act(() => {
			setModal(null);
		});

		expect(screen.queryByRole('heading', { name: 'Modal' })).not.toBeInTheDocument();

		expect(handleClose).not.toHaveBeenCalled();
	});
});
