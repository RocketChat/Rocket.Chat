import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CreateTeamModal from './CreateTeamModal';
import { createFakeLicenseInfo } from '../../../../tests/mocks/data';

jest.mock('../../../lib/rooms/roomCoordinator', () => ({}));

const withAbac = ({ enforced = true, attributes = [{ _id: 'a1', key: 'clearance', values: ['secret'] }] } = {}) =>
	mockAppRoot()
		.withJohnDoe()
		.withSetting('ABAC_Enabled', true)
		.withSetting('UI_Allow_room_names_with_special_chars', true)
		.withSetting('ABAC_Enforce_All_Rooms', enforced)
		.withEndpoint('GET', '/v1/licenses.info', jest.fn().mockResolvedValue({ license: createFakeLicenseInfo({ activeModules: ['abac'] }) }))
		.withEndpoint(
			'GET',
			'/v1/abac/attributes',
			jest.fn().mockResolvedValue({ attributes, offset: 0, count: attributes.length, total: attributes.length }),
		)
		.withEndpoint('POST', '/v1/abac/membership-preview', jest.fn())
		.withEndpoint('POST', '/v1/abac/attribute-assignability', jest.fn())
		.withEndpoint('GET', '/v1/rooms.nameExists', jest.fn().mockResolvedValue({ exists: false }))
		.build();

describe('CreateTeamModal', () => {
	it('should render with encryption option disabled and set to off when E2E_Enable=false and E2E_Enabled_Default_PrivateRooms=false', async () => {
		render(<CreateTeamModal onClose={() => null} />, {
			wrapper: mockAppRoot().withSetting('E2E_Enable', false).withSetting('E2E_Enabled_Default_PrivateRooms', false).build(),
		});

		await userEvent.click(screen.getByText('Advanced_settings'));

		const encrypted = screen.getByLabelText('Teams_New_Encrypted_Label') as HTMLInputElement;
		expect(encrypted).toBeInTheDocument();
		expect(encrypted).not.toBeChecked();
		expect(encrypted).toBeDisabled();
	});

	it('should render with encryption option enabled and set to off when E2E_Enable=true and E2E_Enabled_Default_PrivateRooms=false', async () => {
		render(<CreateTeamModal onClose={() => null} />, {
			wrapper: mockAppRoot().withSetting('E2E_Enable', true).withSetting('E2E_Enabled_Default_PrivateRooms', false).build(),
		});

		await userEvent.click(screen.getByText('Advanced_settings'));

		const encrypted = screen.getByLabelText('Teams_New_Encrypted_Label') as HTMLInputElement;
		expect(encrypted).toBeInTheDocument();
		expect(encrypted).not.toBeChecked();
		expect(encrypted).toBeEnabled();
	});

	it('should render with encryption option disabled and set to off when E2E_Enable=false and E2E_Enabled_Default_PrivateRooms=true', async () => {
		render(<CreateTeamModal onClose={() => null} />, {
			wrapper: mockAppRoot().withSetting('E2E_Enable', false).withSetting('E2E_Enabled_Default_PrivateRooms', true).build(),
		});

		await userEvent.click(screen.getByText('Advanced_settings'));

		const encrypted = screen.getByLabelText('Teams_New_Encrypted_Label') as HTMLInputElement;
		expect(encrypted).toBeInTheDocument();

		expect(encrypted).not.toBeChecked();
		expect(encrypted).toBeDisabled();
	});

	it('should render with encryption option enabled and set to on when E2E_Enable=true and E2E_Enabled_Default_PrivateRooms=True', async () => {
		render(<CreateTeamModal onClose={() => null} />, {
			wrapper: mockAppRoot().withSetting('E2E_Enable', true).withSetting('E2E_Enabled_Default_PrivateRooms', true).build(),
		});

		await userEvent.click(screen.getByText('Advanced_settings'));

		const encrypted = screen.getByLabelText('Teams_New_Encrypted_Label') as HTMLInputElement;
		expect(encrypted).toBeChecked();
		expect(encrypted).toBeEnabled();
	});

	it('when Private goes ON → OFF: forces Encrypted OFF and disables it (E2E_Enable=true, E2E_Enabled_Default_PrivateRooms=true)', async () => {
		render(<CreateTeamModal onClose={() => null} />, {
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
		render(<CreateTeamModal onClose={() => null} />, {
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
		render(<CreateTeamModal onClose={() => null} />, {
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
		render(<CreateTeamModal onClose={() => null} />, {
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

	it('should render a private team with encryption checked and disabled for changes when private room encryption is forced', async () => {
		render(<CreateTeamModal onClose={() => null} />, {
			wrapper: mockAppRoot().withSetting('E2E_Enable', true).withSetting('E2E_Force_Encryption_For_Private_Rooms', true).build(),
		});

		await userEvent.click(screen.getByText('Advanced_settings'));

		const encrypted = screen.getByLabelText('Teams_New_Encrypted_Label') as HTMLInputElement;
		const priv = screen.getByLabelText('Teams_New_Private_Label') as HTMLInputElement;

		// private by default: encrypted is forced ON and cannot be changed
		expect(priv).toBeChecked();
		expect(encrypted).toBeChecked();
		expect(encrypted).toBeDisabled();

		// Private ON -> OFF: encrypted turns OFF and stays disabled (public teams cannot be encrypted)
		await userEvent.click(priv);
		expect(priv).not.toBeChecked();
		expect(encrypted).not.toBeChecked();
		expect(encrypted).toBeDisabled();

		// Private OFF -> ON: encryption is forced back ON and remains disabled
		await userEvent.click(priv);
		expect(priv).toBeChecked();
		expect(encrypted).toBeChecked();
		expect(encrypted).toBeDisabled();
	});

	it('should disable and turn on ReadOnly toggle when Broadcast is ON and no set-readonly permission', async () => {
		render(<CreateTeamModal onClose={() => null} />, {
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
		render(<CreateTeamModal onClose={() => null} />, {
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
		render(<CreateTeamModal onClose={() => null} />, {
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
		render(<CreateTeamModal onClose={() => null} />, {
			wrapper: mockAppRoot().withPermission('set-readonly').build(),
		});

		await userEvent.click(screen.getByText('Advanced_settings'));

		const broadcast = screen.getByLabelText('Teams_New_Broadcast_Label') as HTMLInputElement;
		const readOnly = screen.getByLabelText('Teams_New_Read_only_Label') as HTMLInputElement;

		expect(broadcast).not.toBeChecked();
		expect(readOnly).not.toBeChecked();
		expect(readOnly).toBeEnabled();
	});

	/**
	 * ABAC-P4 QA — a team's main room is a room like any other, so team creation follows the same
	 * stepped flow as channel creation. It used to be offered only for channels.
	 */
	describe('ABAC', () => {
		it('runs the stepped flow when the workspace enforces ABAC', async () => {
			render(<CreateTeamModal onClose={() => null} />, { wrapper: withAbac() });

			expect(await screen.findByText('ABAC_Step_n_of_m')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
			expect(screen.queryByRole('button', { name: 'Create' })).not.toBeInTheDocument();
		});

		it('locks ABAC Managed on under enforcement, which forces the team private', async () => {
			render(<CreateTeamModal onClose={() => null} />, { wrapper: withAbac() });

			const managed = (await screen.findByLabelText('ABAC_Managed')) as HTMLInputElement;
			expect(managed).toBeChecked();
			expect(managed).toBeDisabled();
			expect(screen.getByLabelText('Teams_New_Private_Label')).toBeChecked();
		});

		it('leaves the single-page form alone when ABAC is not enabled', () => {
			render(<CreateTeamModal onClose={() => null} />, { wrapper: mockAppRoot().build() });

			expect(screen.queryByText('ABAC_Step_n_of_m')).not.toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
		});

		it('says why the attribute step cannot be completed when the user has nothing to assign', async () => {
			render(<CreateTeamModal onClose={() => null} />, { wrapper: withAbac({ attributes: [] }) });

			// The name field is the first textbox in the dialog; it has to be filled for step 1 to pass.
			await userEvent.type((await screen.findAllByRole('textbox'))[0], 'abac-team');
			await userEvent.click(screen.getByRole('button', { name: 'Next' }));

			expect(await screen.findByText('ABAC_No_attributes_to_assign')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
		});
	});
});
