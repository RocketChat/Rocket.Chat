import { useTranslation } from 'react-i18next';

import GenericModal from '../../../components/GenericModal';

type CustomUserStatusDisabledModalProps = { isAdmin: boolean; onConfirm: () => void; onClose: () => void };

const CustomUserStatusDisabledModal = ({ isAdmin, onConfirm, onClose }: CustomUserStatusDisabledModalProps) => {
	const { t } = useTranslation();
	return isAdmin ? (
		<GenericModal
			title={t('User_status_disabled_learn_more')}
			cancelText={t('Close')}
			confirmText={t('Go_to_workspace_settings')}
			children={t('User_status_disabled_learn_more_description')}
			onConfirm={onConfirm}
			onClose={onClose}
			onCancel={onClose}
			icon={null}
			variant='warning'
		/>
	) : (
		<GenericModal
			title={t('User_status_disabled_learn_more')}
			confirmText={t('Close')}
			children={t('User_status_disabled_learn_more_description')}
			onConfirm={onConfirm}
			onClose={onClose}
			icon={null}
		/>
	);
};

export default CustomUserStatusDisabledModal;
