import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CreateTeamModal from './CreateTeamModal';
import CreateTeamModalOld from '../../../sidebar/header/CreateTeam';

jest.mock('../../../lib/utils/goToRoomById', () => ({
	goToRoomById: jest.fn(),
}));

type CreateTeamModalComponentType = typeof CreateTeamModal | typeof CreateTeamModalOld;
// eslint-disable-next-line @typescript-eslint/naming-convention

describe.each([
	['CreateTeamModal', CreateTeamModalOld],
	['CreateTeamModal in NavbarV2', CreateTeamModal],
] as const)(
	'%s',
	// eslint-disable-next-line @typescript-eslint/naming-convention
	(_name: string, CreateTeamModalComponent: CreateTeamModalComponentType) => {
		it('should render with encryption option disabled and set to off when E2E_Enable=false and E2E_Enabled_Default_PrivateRooms=false', async () => {
			render(<CreateTeamModalComponent onClose={() => null} />, {
				wrapper: mockAppRoot().withSetting('E2E_Enable', false).withSetting('E2E_Enabled_Default_PrivateRooms', false).build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const encrypted = screen.getByLabelText('Teams_New_Encrypted_Label') as HTMLInputElement;
			expect(encrypted).toBeInTheDocument();
			expect(encrypted).not.toBeChecked();
			expect(encrypted).toBeDisabled();
		});

		it('should render with encryption option enabled and set to off when E2E_Enable=true and E2E_Enabled_Default_PrivateRooms=false', async () => {
			render(<CreateTeamModalComponent onClose={() => null} />, {
				wrapper: mockAppRoot().withSetting('E2E_Enable', true).withSetting('E2E_Enabled_Default_PrivateRooms', false).build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const encrypted = screen.getByLabelText('Teams_New_Encrypted_Label') as HTMLInputElement;
			expect(encrypted).toBeInTheDocument();
			expect(encrypted).not.toBeChecked();
			expect(encrypted).toBeEnabled();
		});

		it('should render with encryption option disabled and set to off when E2E_Enable=false and E2E_Enabled_Default_PrivateRooms=true', async () => {
			render(<CreateTeamModalComponent onClose={() => null} />, {
				wrapper: mockAppRoot().withSetting('E2E_Enable', false).withSetting('E2E_Enabled_Default_PrivateRooms', true).build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const encrypted = screen.getByLabelText('Teams_New_Encrypted_Label') as HTMLInputElement;
			expect(encrypted).toBeInTheDocument();

			expect(encrypted).not.toBeChecked();
			expect(encrypted).toBeDisabled();
		});

		it('should render with encryption option enabled and set to on when E2E_Enable=true and E2E_Enabled_Default_PrivateRooms=True', async () => {
			render(<CreateTeamModalComponent onClose={() => null} />, {
				wrapper: mockAppRoot().withSetting('E2E_Enable', true).withSetting('E2E_Enabled_Default_PrivateRooms', true).build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const encrypted = screen.getByLabelText('Teams_New_Encrypted_Label') as HTMLInputElement;
			expect(encrypted).toBeChecked();
			expect(encrypted).toBeEnabled();
		});

		it('when Private goes ON → OFF: forces Encrypted OFF and disables it (E2E_Enable=true, E2E_Enabled_Default_PrivateRooms=true)', async () => {
			render(<CreateTeamModalComponent onClose={() => null} />, {
				wrapper: mockAppRoot().withSetting('E2E_Enable', true).withSetting('E2E_Enabled_Default_PrivateRooms', true).build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const encrypted = screen.getByLabelText('Teams_New_Encrypted_Label') as HTMLInputElement;
			const priv = screen.getByLabelText('Teams_New_Private_Label') as HTMLInputElement;

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
			render(<CreateTeamModalComponent onClose={() => null} />, {
				wrapper: mockAppRoot().withSetting('E2E_Enable', true).withSetting('E2E_Enabled_Default_PrivateRooms', true).build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const encrypted = screen.getByLabelText('Teams_New_Encrypted_Label') as HTMLInputElement;
			const priv = screen.getByLabelText('Teams_New_Private_Label') as HTMLInputElement;

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

		it('private team: toggling Broadcast on/off does not change or disable Encrypted', async () => {
			render(<CreateTeamModalComponent onClose={() => null} />, {
				wrapper: mockAppRoot().withSetting('E2E_Enable', true).withSetting('E2E_Enabled_Default_PrivateRooms', true).build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const encrypted = screen.getByLabelText('Teams_New_Encrypted_Label') as HTMLInputElement;
			const broadcast = screen.getByLabelText('Teams_New_Broadcast_Label') as HTMLInputElement;
			const priv = screen.getByLabelText('Teams_New_Private_Label') as HTMLInputElement;

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

		it('non-private team: Encrypted remains OFF and disabled regardless of Broadcast state', async () => {
			render(<CreateTeamModalComponent onClose={() => null} />, {
				wrapper: mockAppRoot().withSetting('E2E_Enable', true).withSetting('E2E_Enabled_Default_PrivateRooms', true).build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const encrypted = screen.getByLabelText('Teams_New_Encrypted_Label') as HTMLInputElement;
			const broadcast = screen.getByLabelText('Teams_New_Broadcast_Label') as HTMLInputElement;
			const priv = screen.getByLabelText('Teams_New_Private_Label') as HTMLInputElement;

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

		it('should disable and turn on ReadOnly toggle when Broadcast is ON and no set-readonly permission', async () => {
			render(<CreateTeamModalComponent onClose={() => null} />, {
				wrapper: mockAppRoot().build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const broadcast = screen.getByLabelText('Teams_New_Broadcast_Label') as HTMLInputElement;
			const readOnly = screen.getByLabelText('Teams_New_Read_only_Label') as HTMLInputElement;

			expect(readOnly).not.toBeChecked();

			// Broadcast: OFF -> ON (ReadOnly stays ON + disabled)
			await userEvent.click(broadcast);
			expect(broadcast).toBeChecked();
			expect(readOnly).toBeChecked();
			expect(readOnly).toBeDisabled();
		});

		it('should disable and turn on ReadOnly toggle when Broadcast is ON with set-readonly permission', async () => {
			render(<CreateTeamModalComponent onClose={() => null} />, {
				wrapper: mockAppRoot().withPermission('set-readonly').build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const broadcast = screen.getByLabelText('Teams_New_Broadcast_Label') as HTMLInputElement;
			const readOnly = screen.getByLabelText('Teams_New_Read_only_Label') as HTMLInputElement;

			expect(readOnly).not.toBeChecked();

			// Broadcast: OFF -> ON (ReadOnly stays ON + disabled)
			await userEvent.click(broadcast);
			expect(broadcast).toBeChecked();
			expect(readOnly).toBeChecked();
			expect(readOnly).toBeDisabled();
		});

		it('should disable and turn off ReadOnly toggle when Broadcast is OFF with no set-readonly permission', async () => {
			render(<CreateTeamModalComponent onClose={() => null} />, {
				wrapper: mockAppRoot().build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const broadcast = screen.getByLabelText('Teams_New_Broadcast_Label') as HTMLInputElement;
			const readOnly = screen.getByLabelText('Teams_New_Read_only_Label') as HTMLInputElement;

			expect(broadcast).not.toBeChecked();
			expect(readOnly).not.toBeChecked();
			expect(readOnly).toBeDisabled();
		});

		it('should enable ReadOnly toggle when Broadcast is OFF with set-readonly permission', async () => {
			render(<CreateTeamModalComponent onClose={() => null} />, {
				wrapper: mockAppRoot().withPermission('set-readonly').build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const broadcast = screen.getByLabelText('Teams_New_Broadcast_Label') as HTMLInputElement;
			const readOnly = screen.getByLabelText('Teams_New_Read_only_Label') as HTMLInputElement;

			expect(broadcast).not.toBeChecked();
			expect(readOnly).not.toBeChecked();
			expect(readOnly).toBeEnabled();
		});
	},
);

/*
Additional tests appended to expand coverage of toggle interactions across E2E, Private, Broadcast, and ReadOnly states.
Testing stack:
  - Test runner: Jest
  - Libraries: @testing-library/react and @testing-library/user-event
These tests follow the same conventions as the existing suite and focus on user-observable behavior.
*/

describe.each([
	['CreateTeamModal', CreateTeamModalOld],
	['CreateTeamModal in NavbarV2', CreateTeamModal],
] as const)('%s – additional interactions', (_name: string, CreateTeamModalComponent: CreateTeamModalComponentType) => {
	it('E2E enabled + default non-private: Encrypted can be turned ON, Private OFF forces Encrypted OFF+disabled, Private ON re-enables it', async () => {
		render(<CreateTeamModalComponent onClose={() => null} />, {
			wrapper: mockAppRoot().withSetting('E2E_Enable', true).withSetting('E2E_Enabled_Default_PrivateRooms', false).build(),
		});

		await userEvent.click(screen.getByText('Advanced_settings'));

		const encrypted = screen.getByLabelText('Teams_New_Encrypted_Label') as HTMLInputElement;
		const priv = screen.getByLabelText('Teams_New_Private_Label') as HTMLInputElement;

		// With E2E enabled and this configuration, Encrypted should be available to the user
		expect(encrypted).toBeInTheDocument();
		expect(encrypted).toBeEnabled();
		expect(encrypted).not.toBeChecked();

		// User can turn encryption ON
		await userEvent.click(encrypted);
		expect(encrypted).toBeChecked();

		// Private: ON -> OFF enforces Encrypted OFF + disabled
		await userEvent.click(priv);
		expect(priv).not.toBeChecked();
		expect(encrypted).not.toBeChecked();
		expect(encrypted).toBeDisabled();

		// Private: OFF -> ON keeps Encrypted OFF but re-enables it
		await userEvent.click(priv);
		expect(priv).toBeChecked();
		expect(encrypted).not.toBeChecked();
		expect(encrypted).toBeEnabled();
	});

	it('non-private: clicking Encrypted does nothing when disabled', async () => {
		render(<CreateTeamModalComponent onClose={() => null} />, {
			wrapper: mockAppRoot().withSetting('E2E_Enable', true).withSetting('E2E_Enabled_Default_PrivateRooms', true).build(),
		});

		await userEvent.click(screen.getByText('Advanced_settings'));

		const encrypted = screen.getByLabelText('Teams_New_Encrypted_Label') as HTMLInputElement;
		const priv = screen.getByLabelText('Teams_New_Private_Label') as HTMLInputElement;

		// Switch to non-private
		await userEvent.click(priv);
		expect(priv).not.toBeChecked();

		// Encrypted should be OFF + disabled
		expect(encrypted).not.toBeChecked();
		expect(encrypted).toBeDisabled();

		// Attempting to click should not change state
		await userEvent.click(encrypted);
		expect(encrypted).not.toBeChecked();
		expect(encrypted).toBeDisabled();
	});

	it('Broadcast toggling does not alter Private state', async () => {
		render(<CreateTeamModalComponent onClose={() => null} />, {
			wrapper: mockAppRoot().withSetting('E2E_Enable', true).withSetting('E2E_Enabled_Default_PrivateRooms', true).build(),
		});

		await userEvent.click(screen.getByText('Advanced_settings'));

		const broadcast = screen.getByLabelText('Teams_New_Broadcast_Label') as HTMLInputElement;
		const priv = screen.getByLabelText('Teams_New_Private_Label') as HTMLInputElement;

		// Private initially ON in this configuration
		expect(priv).toBeChecked();
		expect(broadcast).not.toBeChecked();

		await userEvent.click(broadcast);
		expect(broadcast).toBeChecked();
		expect(priv).toBeChecked(); // Private unchanged

		await userEvent.click(broadcast);
		expect(broadcast).not.toBeChecked();
		expect(priv).toBeChecked(); // Still unchanged
	});

	it('With set-readonly permission: Broadcast ON forces ReadOnly ON+disabled; OFF re-enables it and preserves state', async () => {
		render(<CreateTeamModalComponent onClose={() => null} />, {
			wrapper: mockAppRoot().withPermission('set-readonly').build(),
		});

		await userEvent.click(screen.getByText('Advanced_settings'));

		const broadcast = screen.getByLabelText('Teams_New_Broadcast_Label') as HTMLInputElement;
		const readOnly = screen.getByLabelText('Teams_New_Read_only_Label') as HTMLInputElement;

		// With permission and Broadcast OFF, ReadOnly is user-controllable
		expect(broadcast).not.toBeChecked();
		expect(readOnly).toBeEnabled();
		expect(readOnly).not.toBeChecked();

		// User can enable ReadOnly
		await userEvent.click(readOnly);
		expect(readOnly).toBeChecked();

		// Turning Broadcast ON forces ReadOnly ON and disables it
		await userEvent.click(broadcast);
		expect(broadcast).toBeChecked();
		expect(readOnly).toBeChecked();
		expect(readOnly).toBeDisabled();

		// Turning Broadcast OFF re-enables ReadOnly and preserves ON state
		await userEvent.click(broadcast);
		expect(broadcast).not.toBeChecked();
		expect(readOnly).toBeChecked();
		expect(readOnly).toBeEnabled();

		// User can then toggle ReadOnly OFF again
		await userEvent.click(readOnly);
		expect(readOnly).not.toBeChecked();
	});

	it('E2E disabled: Encrypted remains OFF and disabled regardless of Private state', async () => {
		render(<CreateTeamModalComponent onClose={() => null} />, {
			wrapper: mockAppRoot().withSetting('E2E_Enable', false).withSetting('E2E_Enabled_Default_PrivateRooms', true).build(),
		});

		await userEvent.click(screen.getByText('Advanced_settings'));

		const encrypted = screen.getByLabelText('Teams_New_Encrypted_Label') as HTMLInputElement;
		const priv = screen.getByLabelText('Teams_New_Private_Label') as HTMLInputElement;

		// Initially OFF + disabled
		expect(encrypted).not.toBeChecked();
		expect(encrypted).toBeDisabled();

		// Toggle Private OFF -> still OFF + disabled
		await userEvent.click(priv);
		expect(priv).not.toBeChecked();
		expect(encrypted).not.toBeChecked();
		expect(encrypted).toBeDisabled();

		// Toggle Private ON again -> still OFF + disabled because E2E is disabled globally
		await userEvent.click(priv);
		expect(priv).toBeChecked();
		expect(encrypted).not.toBeChecked();
		expect(encrypted).toBeDisabled();
	});
});
