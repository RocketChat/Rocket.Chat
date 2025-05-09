import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRole, useRoute, useSetModal } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useHasLicenseModule } from './useHasLicenseModule';
import TeamsVoipConfigModal from '../views/room/contextualBar/TeamsVoipConfigModal';

export const useVoipWarningModal = (): (() => void) => {
	const setModal = useSetModal();
	const isAdmin = useRole('admin');
	const hasModule = useHasLicenseModule('teams-voip') === true;
	const teamsVoipSettingsRoute = useRoute('admin-settings');

	const handleClose = useEffectEvent(() => setModal(null));

	const handleRedirectToConfiguration = useEffectEvent(() => {
		handleClose();
		teamsVoipSettingsRoute.push({
			group: 'VoIP_TeamCollab',
		});
	});

	return useMemo(
		() => (): void =>
			setModal(
				<TeamsVoipConfigModal hasModule={hasModule} onClose={handleClose} onConfirm={handleRedirectToConfiguration} isAdmin={isAdmin} />,
			),
		[handleClose, handleRedirectToConfiguration, isAdmin, setModal, hasModule],
	);
};
