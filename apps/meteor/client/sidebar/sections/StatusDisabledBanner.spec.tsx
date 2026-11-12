import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import StatusDisabledBanner from './StatusDisabledBanner';

const openModal = jest.fn();

jest.mock('../../views/admin/customUserStatus/hooks/useStatusDisabledModal', () => ({
	useStatusDisabledModal: () => openModal,
}));

beforeEach(() => openModal.mockClear());

describe('StatusDisabledBanner', () => {
	it('names the dismiss button', async () => {
		const onDismiss = jest.fn();
		render(<StatusDisabledBanner onDismiss={onDismiss} />, { wrapper: mockAppRoot().build() });

		await userEvent.click(screen.getByRole('button', { name: 'Close' }));
		expect(onDismiss).toHaveBeenCalledTimes(1);
	});
});
