import { Box, Icon, Stack } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

type PopupBlockedModalProps = {
	onClose: () => void;
	onConfirm: () => void;
};

const PopupBlockedModal = ({ onClose, onConfirm }: PopupBlockedModalProps) => {
	const { t } = useTranslation();
	const workspaceUrl = useSetting('Site_Url');

	const confirmButtonContent = (
		<Stack direction='row' gap='x8' align='center'>
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
			<>
				<Box marginBlockEnd='x24'>{t('Your_web_browser_blocked_Rocket_Chat_from_opening_tab')}</Box>
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

export default PopupBlockedModal;
