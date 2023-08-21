import { Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import GenericModal from '../../../../components/GenericModal';

const VideoConfBlockModal = ({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }): ReactElement => {
	const t = useTranslation();
	const workspaceUrl = useSetting('Site_Url');

	const confirmButtonContent = (
		<Box>
			<Icon mie={8} size='x20' name='new-window' />
			{t('Open_call')}
		</Box>
	);

	const handleConfirm = useCallback(() => {
		onConfirm();
		onClose();
	}, [onClose, onConfirm]);

	return (
		<GenericModal
			icon={null}
			variant='warning'
			title={t('Open_call_in_new_tab')}
			confirmText={confirmButtonContent}
			onConfirm={handleConfirm}
			onCancel={onClose}
			onClose={onClose}
		>
			<>
				<Box mbe={24}>{t('Your_web_browser_blocked_Rocket_Chat_from_opening_tab')}</Box>
				<Box>
					{t('To_prevent_seeing_this_message_again_allow_popups_from_workspace_URL')}
					<Box is='span' fontWeight={700}>
						{workspaceUrl as string}
					</Box>
				</Box>
			</>
		</GenericModal>
	);
};

export default VideoConfBlockModal;
