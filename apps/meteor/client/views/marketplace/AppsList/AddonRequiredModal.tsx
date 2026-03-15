import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { useExternalLink } from '../../../hooks/useExternalLink';
import { GET_ADDONS_LINK } from '../../admin/subscription/utils/links';

export type AddonActionType = 'install' | 'enable' | 'update';

type AddonRequiredModalProps = {
	actionType: AddonActionType;
	onDismiss: () => void;
	onInstallAnyway: () => void;
};

const AddonRequiredModal = ({ actionType, onDismiss, onInstallAnyway }: AddonRequiredModalProps) => {
	const { t } = useTranslation();

	const handleOpenLink = useExternalLink();

	const handleContactSales = () => {
		handleOpenLink(GET_ADDONS_LINK);
		onDismiss();
	};

	return (
		<GenericModal
			title={t('Add-on_required')}
			onClose={onDismiss}
			onDismiss={onDismiss}
			confirmText={t('Contact_sales')}
			onConfirm={handleContactSales}
			cancelText={['install', 'update'].includes(actionType) ? (actionType === 'install' ? t('Install_anyway') : t('Update_anyway')) : undefined}
			onCancel={['install', 'update'].includes(actionType) ? onInstallAnyway : undefined}
		>
			{t('Add-on_required_modal_enable_content')}
		</GenericModal>
	);
};

export default AddonRequiredModal;
