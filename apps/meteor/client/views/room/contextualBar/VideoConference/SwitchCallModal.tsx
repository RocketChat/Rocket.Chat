import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

type SwitchCallModalProps = {
	/** room name (or DM peer) of the call the user is currently in */
	currentCallRoomName: string;
	onStay: () => void;
	onSwitch: () => void;
};

/**
 * "One call at a time" conflict modal ("Conflict: already in a call" in the
 * Figma spec). Shown in the app window where the join click happened —
 * never inside the call window.
 */
const SwitchCallModal = ({ currentCallRoomName, onStay, onSwitch }: SwitchCallModalProps) => {
	const { t } = useTranslation();

	return (
		<GenericModal
			open
			icon={null}
			title={t('Switch_to_this_call')}
			confirmText={t('Switch_call')}
			cancelText={t('Stay_in_current_call')}
			onConfirm={onSwitch}
			onCancel={onStay}
			onClose={onStay}
		>
			{t('Switch_call_modal_body', { room: currentCallRoomName })}
		</GenericModal>
	);
};

export default SwitchCallModal;
