import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

type CameraWithoutEffectModalProps = {
	onConfirm: () => void;
	onCancel: () => void;
};

/** Asked before turning the camera on without the background effect that just failed to start. */
const CameraWithoutEffectModal = ({ onConfirm, onCancel }: CameraWithoutEffectModalProps) => {
	const { t } = useTranslation();

	return (
		<GenericModal
			variant='warning'
			title={t('Camera_without_background_effect_title')}
			confirmText={t('Turn_on_camera')}
			cancelText={t('Cancel')}
			onConfirm={onConfirm}
			onCancel={onCancel}
			onClose={onCancel}
		>
			{t('Camera_without_background_effect_description')}
		</GenericModal>
	);
};

export default CameraWithoutEffectModal;
