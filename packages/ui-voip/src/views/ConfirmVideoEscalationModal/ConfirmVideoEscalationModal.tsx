import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

type ConfirmVideoEscalationModalProps = {
	onCancel: () => void;
	onConfirm: () => void;
};

const ConfirmVideoEscalationModal = ({ onCancel, onConfirm }: ConfirmVideoEscalationModalProps) => {
	const { t } = useTranslation();

	return (
		<GenericModal
			variant='warning'
			icon={null}
			title={t('Video_escalation_modal_title')}
			confirmText={t('Start_video_call')}
			cancelText={t('Cancel')}
			onConfirm={onConfirm}
			onCancel={onCancel}
			onClose={onCancel}
		>
			{t('Video_escalation_modal_description')}
		</GenericModal>
	);
};

export default ConfirmVideoEscalationModal;
