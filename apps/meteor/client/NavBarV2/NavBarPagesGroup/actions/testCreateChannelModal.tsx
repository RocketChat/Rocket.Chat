import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type CreateChannelModal2Component from './CreateChannelModal';
import type CreateChannelModalComponent from '../../../sidebar/header/CreateChannel';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function testCreateChannelModal(CreateChannelModal: typeof CreateChannelModalComponent | typeof CreateChannelModal2Component) {
	describe('CreateChannelModal', () => {
		it('should render with encryption option disabled and set to off when E2E_Enable=false and E2E_Enabled_Default_PrivateRooms=false', async () => {
			render(<CreateChannelModal onClose={() => null} />, {
				wrapper: mockAppRoot().withSetting('E2E_Enable', false).withSetting('E2E_Enabled_Default_PrivateRooms', false).build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const encrypted = screen.getByLabelText('Encrypted') as HTMLInputElement;
			expect(encrypted).toBeInTheDocument();
			expect(encrypted).not.toBeChecked();
			expect(encrypted).toBeDisabled();
		});

		it('should render with encryption option enabled and set to off when E2E_Enable=true and E2E_Enabled_Default_PrivateRooms=false', async () => {
			render(<CreateChannelModal onClose={() => null} />, {
				wrapper: mockAppRoot().withSetting('E2E_Enable', true).withSetting('E2E_Enabled_Default_PrivateRooms', false).build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const encrypted = screen.getByLabelText('Encrypted') as HTMLInputElement;
			expect(encrypted).toBeInTheDocument();
			expect(encrypted).not.toBeChecked();
			expect(encrypted).toBeEnabled();
		});

		it('should render with encryption option disabled and set to off when E2E_Enable=false and E2E_Enabled_Default_PrivateRooms=true', async () => {
			render(<CreateChannelModal onClose={() => null} />, {
				wrapper: mockAppRoot().withSetting('E2E_Enable', false).withSetting('E2E_Enabled_Default_PrivateRooms', true).build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const encrypted = screen.getByLabelText('Encrypted') as HTMLInputElement;
			expect(encrypted).toBeInTheDocument();

			expect(encrypted).not.toBeChecked();
			expect(encrypted).toBeDisabled();
		});

		it('should render with encryption option enabled and set to on when E2E_Enable=true and E2E_Enabled_Default_PrivateRooms=True', async () => {
			render(<CreateChannelModal onClose={() => null} />, {
				wrapper: mockAppRoot().withSetting('E2E_Enable', true).withSetting('E2E_Enabled_Default_PrivateRooms', true).build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const encrypted = screen.getByLabelText('Encrypted') as HTMLInputElement;
			expect(encrypted).toBeChecked();
			expect(encrypted).toBeEnabled();
		});

		it('when Private goes ON → OFF: forces Encrypted OFF and disables it (E2E_Enable=true, E2E_Enabled_Default_PrivateRooms=true)', async () => {
			render(<CreateChannelModal onClose={() => null} />, {
				wrapper: mockAppRoot().withSetting('E2E_Enable', true).withSetting('E2E_Enabled_Default_PrivateRooms', true).build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const encrypted = screen.getByLabelText('Encrypted') as HTMLInputElement;
			const priv = screen.getByLabelText('Private') as HTMLInputElement;

			// initial: private=true, encrypted ON and enabled
			expect(priv).toBeChecked();
			expect(encrypted).toBeChecked();
			expect(encrypted).toBeEnabled();

			// Private ON -> OFF: encrypted must become OFF and disabled
			await userEvent.click(priv);
			expect(priv).not.toBeChecked();
			expect(encrypted).not.toBeChecked();
			expect(encrypted).toBeDisabled();
		});

		it('when Private goes OFF → ON: keeps Encrypted OFF but re-enables it (E2E_Enable=true, E2E_Enabled_Default_PrivateRooms=true)', async () => {
			render(<CreateChannelModal onClose={() => null} />, {
				wrapper: mockAppRoot().withSetting('E2E_Enable', true).withSetting('E2E_Enabled_Default_PrivateRooms', true).build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const encrypted = screen.getByLabelText('Encrypted') as HTMLInputElement;
			const priv = screen.getByLabelText('Private') as HTMLInputElement;

			// turn private OFF to simulate user path from non-private
			await userEvent.click(priv);
			expect(priv).not.toBeChecked();
			expect(encrypted).not.toBeChecked();
			expect(encrypted).toBeDisabled();

			// turn private back ON -> encrypted should remain OFF but become enabled
			await userEvent.click(priv);
			expect(priv).toBeChecked();
			expect(encrypted).not.toBeChecked();
			expect(encrypted).toBeEnabled();
		});

		it('private room: toggling Broadcast on/off does not change or disable Encrypted', async () => {
			render(<CreateChannelModal onClose={() => null} />, {
				wrapper: mockAppRoot().withSetting('E2E_Enable', true).withSetting('E2E_Enabled_Default_PrivateRooms', true).build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const encrypted = screen.getByLabelText('Encrypted') as HTMLInputElement;
			const broadcast = screen.getByLabelText('Broadcast') as HTMLInputElement;
			const priv = screen.getByLabelText('Private') as HTMLInputElement;

			expect(priv).toBeChecked();
			expect(encrypted).toBeChecked();
			expect(encrypted).toBeEnabled();
			expect(broadcast).not.toBeChecked();

			// Broadcast: OFF -> ON (Encrypted unchanged + enabled)
			await userEvent.click(broadcast);
			expect(broadcast).toBeChecked();
			expect(encrypted).toBeChecked();
			expect(encrypted).toBeEnabled();

			// Broadcast: ON -> OFF (Encrypted unchanged + enabled)
			await userEvent.click(broadcast);
			expect(broadcast).not.toBeChecked();
			expect(encrypted).toBeChecked();
			expect(encrypted).toBeEnabled();

			// User can still toggle Encrypted freely while Broadcast is OFF
			await userEvent.click(encrypted);
			expect(encrypted).not.toBeChecked();

			// User can still toggle Encrypted freely while Broadcast is ON
			await userEvent.click(broadcast);
			expect(broadcast).toBeChecked();
			expect(encrypted).not.toBeChecked();
			expect(encrypted).toBeEnabled();
		});

		it('non-private room: Encrypted remains OFF and disabled regardless of Broadcast state', async () => {
			render(<CreateChannelModal onClose={() => null} />, {
				wrapper: mockAppRoot().withSetting('E2E_Enable', true).withSetting('E2E_Enabled_Default_PrivateRooms', true).build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const encrypted = screen.getByLabelText('Encrypted') as HTMLInputElement;
			const broadcast = screen.getByLabelText('Broadcast') as HTMLInputElement;
			const priv = screen.getByLabelText('Private') as HTMLInputElement;

			// Switch to non-private
			await userEvent.click(priv);
			expect(priv).not.toBeChecked();

			// Encrypted must be OFF + disabled (non-private cannot be encrypted)
			expect(encrypted).not.toBeChecked();
			expect(encrypted).toBeDisabled();

			// Broadcast: OFF -> ON (Encrypted stays OFF + disabled)
			await userEvent.click(broadcast);
			expect(broadcast).toBeChecked();
			expect(encrypted).not.toBeChecked();
			expect(encrypted).toBeDisabled();

			// Broadcast: ON -> OFF (Encrypted still OFF + disabled)
			await userEvent.click(broadcast);
			expect(broadcast).not.toBeChecked();
			expect(encrypted).not.toBeChecked();
			expect(encrypted).toBeDisabled();
		});
	});
}
