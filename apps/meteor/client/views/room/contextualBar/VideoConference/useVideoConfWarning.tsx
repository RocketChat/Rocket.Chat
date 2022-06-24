import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useRoute, useSetting, useRole, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import { availabilityErrors } from '../../../../../lib/videoConference/constants';
import GenericModal from '../../../../components/GenericModal';

export const useVideoConfWarning = (): ((error: unknown) => void) => {
	const t = useTranslation();
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

	return useMemo(() => {
		if (!isAdmin) {
			return (): void =>
				setModal(
					<GenericModal icon={null} title={t('Video_conference_not_available')} onClose={handleClose} onConfirm={handleClose}>
						{t('Video_conference_apps_can_be_installed')}
					</GenericModal>,
				);
		}

		return (error): void => {
			if (error === availabilityErrors.NOT_CONFIGURED || error === availabilityErrors.NOT_ACTIVE) {
				return setModal(
					<GenericModal
						icon={null}
						variant='warning'
						title={t('Configure_video_conference')}
						onCancel={handleClose}
						onClose={handleClose}
						onConfirm={(): void => handleRedirectToConfiguration(error)}
						confirmText={t('Open_settings')}
					>
						{t('Configure_video_conference_to_use')}
					</GenericModal>,
				);
			}

			if (error === availabilityErrors.NO_APP || !!workspaceRegistered) {
				return setModal(
					<GenericModal
						icon={null}
						variant='warning'
						title={t('Video_conference_app_required')}
						onCancel={handleClose}
						onClose={handleClose}
						onConfirm={handleOpenMarketplace}
						confirmText={t('Explore_marketplace')}
					>
						{t('Video_conference_apps_available')}
					</GenericModal>,
				);
			}
		};
	}, [handleClose, handleOpenMarketplace, handleRedirectToConfiguration, isAdmin, setModal, t, workspaceRegistered]);
};
