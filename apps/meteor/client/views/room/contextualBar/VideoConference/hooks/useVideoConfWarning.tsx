import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useRoute, useRole } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import VideoConfConfigModal from '../VideoConfConfigModal';

export const useVideoConfWarning = (): ((error: unknown) => void) => {
	const setModal = useSetModal();
	const isAdmin = useRole('admin');
	const videoConfSettingsRoute = useRoute('admin-settings');
	const handleClose = useEffectEvent(() => setModal(null));

	const handleRedirectToConfiguration = useEffectEvent(() => {
		handleClose();
		videoConfSettingsRoute.push({
			group: 'Video_Conference',
		});
	});

	return useMemo(
		() => (): void => setModal(<VideoConfConfigModal onClose={handleClose} onConfirm={handleRedirectToConfiguration} isAdmin={isAdmin} />),
		[handleClose, handleRedirectToConfiguration, isAdmin, setModal],
	);
};
