import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CreateChannelModal from './CreateChannelModal';
import CreateChannelModalWithData from './CreateChannelModalWithData';
import { mockAbacRoomCreationRoot as abacRoot } from '../../../../tests/mocks/client/mockAbacRoomCreationRoot';
import { createFakeLicenseInfo } from '../../../../tests/mocks/data';

jest.mock('../../../lib/rooms/roomCoordinator', () => ({}));

const goToAttributesStep = async () => {
	await userEvent.type(await screen.findByRole('textbox', { name: 'Name' }), 'restricted');
	await userEvent.click(screen.getByRole('button', { name: 'Next' }));
	expect(await screen.findByText('ABAC_Room_Attributes')).toBeInTheDocument();
};

describe('CreateChannelModal', () => {
	describe('ABAC', () => {
		it('should keep the single-page modal when ABAC is disabled', () => {
			render(<CreateChannelModalWithData onClose={() => null} />, { wrapper: mockAppRoot().build() });

			expect(screen.queryByLabelText('ABAC_Managed')).not.toBeInTheDocument();
			expect(screen.getByText('Advanced_settings')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
		});

		it('should take two steps for a room that is not ABAC-managed, with Federated on the second', async () => {
			render(<CreateChannelModalWithData onClose={() => null} />, { wrapper: abacRoot() });

			expect(await screen.findByLabelText('ABAC_Managed')).not.toBeChecked();
			expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
			expect(screen.queryByText('Advanced_settings')).not.toBeInTheDocument();

			await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'open');
			await userEvent.click(screen.getByRole('button', { name: 'Next' }));

			expect(await screen.findByText('Step 2 of 2')).toBeInTheDocument();
			expect(screen.getByLabelText('Federation_Matrix_Federated')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
		});

		it('should clear a step error as soon as the field is corrected', async () => {
			render(<CreateChannelModalWithData onClose={() => null} />, { wrapper: abacRoot() });

			await userEvent.click(await screen.findByRole('button', { name: 'Next' }));
			expect(await screen.findByText('Required_field')).toBeInTheDocument();

			await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'fixed');

			await waitFor(() => expect(screen.queryByText('Required_field')).not.toBeInTheDocument());
			expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
		});

		it('should take four steps once ABAC-managed is on, forcing Private on and dropping Federated', async () => {
			render(<CreateChannelModalWithData onClose={() => null} />, { wrapper: abacRoot() });

			await userEvent.click(await screen.findByLabelText('ABAC_Managed'));

			expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
			expect(screen.getByLabelText('Private')).toBeChecked();
			expect(screen.getByLabelText('Private')).toBeDisabled();
			expect(screen.getByLabelText('ABAC_Managed')).toHaveAccessibleDescription('ABAC_Managed_Hint');

			await goToAttributesStep();
			expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
		});

		it('should lock ABAC-managed on under enforcement and say why', async () => {
			render(<CreateChannelModalWithData onClose={() => null} />, { wrapper: abacRoot({ enforced: true }) });

			const managed = await screen.findByLabelText('ABAC_Managed');
			expect(managed).toBeChecked();
			expect(managed).toBeDisabled();
			expect(managed).toHaveAccessibleDescription('ABAC_Managed_Enforced_Hint');
			expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
		});

		it('should disable ABAC-managed with a reason for a creator without the permission', async () => {
			render(<CreateChannelModalWithData onClose={() => null} />, { wrapper: abacRoot({ permissions: ['create-c', 'create-p'] }) });

			const managed = await screen.findByLabelText('ABAC_Managed');
			expect(managed).toBeDisabled();
			expect(managed).toHaveAccessibleDescription('ABAC_Managed_Not_Allowed_Hint');
		});

		it('should disable ABAC-managed with a reason for a creator who can only create public channels', async () => {
			render(<CreateChannelModalWithData onClose={() => null} />, {
				wrapper: abacRoot({ permissions: ['create-abac-managed-room', 'create-c'] }),
			});

			const managed = await screen.findByLabelText('ABAC_Managed');
			expect(managed).toBeDisabled();
			expect(managed).toHaveAccessibleDescription('ABAC_Managed_Private_Only_Hint');
		});

		it('should stop a creator who cannot create an ABAC-managed room under enforcement at the first step', async () => {
			render(<CreateChannelModalWithData onClose={() => null} />, {
				wrapper: abacRoot({ enforced: true, permissions: ['create-c', 'create-p'] }),
			});

			expect(await screen.findByText('ABAC_Room_Creation_Not_Allowed')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
		});

		it('should pre-fill the required attributes without a Remove button, and let optional rows be added and removed', async () => {
			render(<CreateChannelModalWithData onClose={() => null} />, {
				wrapper: abacRoot({
					enforced: true,
					requiredAttributes: ['clearance', 'dept'],
					assignable: [
						{ key: 'clearance', values: ['secret'] },
						{ key: 'dept', values: ['eng'] },
					],
				}),
			});

			await goToAttributesStep();

			expect(screen.getAllByText('Attribute')).toHaveLength(2);
			expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();

			await userEvent.click(screen.getByRole('button', { name: 'ABAC_Add_Attribute' }));
			expect(screen.getAllByText('Attribute')).toHaveLength(3);

			await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
			expect(screen.getAllByText('Attribute')).toHaveLength(2);
		});

		it('should report missing values before the attributes step can be left', async () => {
			render(<CreateChannelModalWithData onClose={() => null} />, { wrapper: abacRoot({ enforced: true, requiredAttributes: ['dept'] }) });

			await goToAttributesStep();
			await userEvent.click(screen.getByRole('button', { name: 'Next' }));

			expect(await screen.findAllByText('Required_field')).not.toHaveLength(0);
			expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
		});

		it('should stop a creator lacking a required attribute with an alert naming it', async () => {
			render(<CreateChannelModalWithData onClose={() => null} />, {
				wrapper: abacRoot({ enforced: true, requiredAttributes: ['clearance', 'dept'], assignable: [{ key: 'dept', values: ['eng'] }] }),
			});

			await goToAttributesStep();

			expect(screen.getByRole('alert')).toHaveTextContent('ABAC_Required_Attributes_Not_Held');
			expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
		});

		it('should wait for the ABAC configuration rather than render the switches before it arrives', async () => {
			let resolveConfig: (value: unknown) => void = () => undefined;
			const config = jest.fn(
				() =>
					new Promise((resolve) => {
						resolveConfig = resolve;
					}),
			);

			render(<CreateChannelModalWithData onClose={() => null} />, { wrapper: abacRoot({ enforced: true, config }) });

			await waitFor(() => expect(config).toHaveBeenCalled());
			expect(screen.queryByLabelText('ABAC_Managed')).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: 'Create' })).not.toBeInTheDocument();

			resolveConfig({ bannersConfig: '', requiredAttributes: [] });

			const managed = await screen.findByLabelText('ABAC_Managed');
			expect(managed).toBeChecked();
			expect(managed).toBeDisabled();
		});
	});

	describe('Encryption', () => {
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

		it('should render a private channel with encryption checked and disabled for changes when private room encryption is forced', async () => {
			render(<CreateChannelModal onClose={() => null} />, {
				wrapper: mockAppRoot().withSetting('E2E_Enable', true).withSetting('E2E_Force_Encryption_For_Private_Rooms', true).build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));

			const encrypted = screen.getByLabelText('Encrypted') as HTMLInputElement;
			const priv = screen.getByLabelText('Private') as HTMLInputElement;

			// private by default: encrypted is forced ON and cannot be changed
			expect(priv).toBeChecked();
			expect(encrypted).toBeChecked();
			expect(encrypted).toBeDisabled();

			// Private ON -> OFF: encrypted turns OFF and stays disabled (public rooms cannot be encrypted)
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
	});

	describe('Federation', () => {
		it('should render with federated option disabled when user lacks license module', async () => {
			render(<CreateChannelModal onClose={() => null} />, {
				wrapper: mockAppRoot().build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));
			const federated = screen.getByLabelText('Federation_Matrix_Federated');
			expect(federated).toHaveAccessibleDescription('error-this-is-a-premium-feature');
			expect(federated).toBeInTheDocument();
			expect(federated).not.toBeChecked();
			expect(federated).toBeDisabled();
		});

		it('should render with federated option disabled if the feature is disabled for workspaces', async () => {
			render(<CreateChannelModal onClose={() => null} />, {
				wrapper: mockAppRoot()
					.withJohnDoe()
					.withSetting('Federation_Matrix_enabled', false)
					.withEndpoint(
						'GET',
						'/v1/licenses.info',
						jest.fn().mockImplementation(() => ({
							license: createFakeLicenseInfo({ activeModules: ['federation'] }),
						})),
					)
					.build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));
			const federated = screen.getByLabelText('Federation_Matrix_Federated');

			expect(federated).toBeInTheDocument();
			expect(federated).not.toBeChecked();
			expect(federated).toBeDisabled();
			expect(federated).toHaveAccessibleDescription('Federation_Matrix_Federated_Description_disabled');
		});

		it('should render with federated option disabled when user lacks permission', async () => {
			render(<CreateChannelModal onClose={() => null} />, {
				wrapper: mockAppRoot()
					.withJohnDoe()
					.withSetting('Federation_Matrix_enabled', true)
					.withEndpoint(
						'GET',
						'/v1/licenses.info',
						jest.fn().mockImplementation(() => ({
							license: createFakeLicenseInfo({ activeModules: ['federation'] }),
						})),
					)
					.build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));
			const federated = screen.getByLabelText('Federation_Matrix_Federated');

			expect(federated).toBeInTheDocument();
			expect(federated).not.toBeChecked();
			expect(federated).toBeDisabled();
			expect(federated).toHaveAccessibleDescription('error-not-authorized-federation');
		});

		it('should render with federated option enabled when user has license module, permission and feature enabled', async () => {
			render(<CreateChannelModal onClose={() => null} />, {
				wrapper: mockAppRoot()
					.withJohnDoe()
					.withSetting('Federation_Matrix_enabled', true)
					.withPermission('access-federation')
					.withEndpoint(
						'GET',
						'/v1/licenses.info',
						jest.fn().mockImplementation(() => ({
							license: createFakeLicenseInfo({ activeModules: ['federation'] }),
						})),
					)
					.build(),
			});

			await userEvent.click(screen.getByText('Advanced_settings'));
			const federated = screen.getByLabelText('Federation_Matrix_Federated');
			expect(federated).toBeInTheDocument();
			expect(federated).not.toBeChecked();
			expect(federated).not.toBeDisabled();
			expect(federated).toHaveAccessibleDescription('Federation_Matrix_Federated_Description');
		});
	});
});
