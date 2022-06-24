import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useRoute, useSetting, useRole } from '@rocket.chat/ui-contexts';
import React from 'react';

import { availabilityErrors } from '../../../../../lib/videoConference/constants';
import GenericModal from '../../../../components/GenericModal';

// TODO: create translation keys
export const useVideoConfWarning = (): ((error: string) => void) => {
	const setModal = useSetModal();
	const videoConfSettingsRoute = useRoute('admin-settings');
	const marketplaceRoute = useRoute('admin-marketplace');
	const workspaceRegistered = useSetting('Cloud_Workspace_Client_Id');
	const isAdmin = useRole('admin');

	const handleClose = useMutableCallback(() => setModal(null));

	const handleRedirectToConfiguration = useMutableCallback((error) => {
		handleClose();
		if (error === availabilityErrors.NOT_CONFIGURED) {
			return marketplaceRoute.push({ context: 'installed' });
		}

		return videoConfSettingsRoute.push({
			group: 'Video_Conference',
		});
	});

	const handleOpenMarketplace = useMutableCallback(() => {
		handleClose();
		marketplaceRoute.push();
	});

	return (error): void => {
		if (!isAdmin) {
			setModal(
				<GenericModal icon={null} title='Video conference not available' onClose={handleClose} onConfirm={handleClose}>
					Video conference apps can be installed in the Rocket.Chat marketplace by a workspace admin.
				</GenericModal>,
			);
		}

		if (error === availabilityErrors.NOT_CONFIGURED || error === availabilityErrors.NOT_ACTIVE) {
			setModal(
				<GenericModal
					icon={null}
					variant='warning'
					title='Configure video conference'
					onCancel={handleClose}
					onClose={handleClose}
					onConfirm={(): void => handleRedirectToConfiguration(error)}
					confirmText='Open settings'
				>
					Configure video conference in order to make it available on this workspace.
				</GenericModal>,
			);
		}

		if (error === availabilityErrors.NO_APP || !!workspaceRegistered) {
			setModal(
				<GenericModal
					icon={null}
					variant='warning'
					title='Video conference app required'
					onCancel={handleClose}
					onClose={handleClose}
					onConfirm={handleOpenMarketplace}
					confirmText='Explore marketplace'
				>
					Video conference apps are available on the Rocket.Chat marketplace.
				</GenericModal>,
			);
		}
	};
};
