import { Icon, Stack, Text } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

const VideoConfBlockModal = ({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) => {
	const t = useTranslation();
	const workspaceUrl = useSetting('Site_Url');

	const confirmButtonContent = (
		<Stack direction='row' align='center' gap='x8'>
			<Icon size='x20' name='new-window' />
			{t('Open_call')}
		</Stack>
	);

	const handleConfirm = useCallback(() => {
		onConfirm();
		onClose();
	}, [onClose, onConfirm]);

	return (
		<GenericModal
			open
			icon={null}
			variant='warning'
			title={t('Open_call_in_new_tab')}
			confirmText={confirmButtonContent}
			onConfirm={handleConfirm}
			onCancel={onClose}
			onClose={onClose}
		>
			<Stack gap='x24'>
				<Text>{t('Your_web_browser_blocked_Rocket_Chat_from_opening_tab')}</Text>
				<Text>
					{t('To_prevent_seeing_this_message_again_allow_popups_from_workspace_URL')}
					<Text is='strong'>{workspaceUrl as string}</Text>
				</Text>
			</Stack>
		</GenericModal>
	);
};

export default VideoConfBlockModal;
