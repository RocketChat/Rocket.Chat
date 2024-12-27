import { useTranslation } from 'react-i18next';

import GenericUpsellModal from '../../../components/GenericUpsellModal';
import { useUpsellActions } from '../../../components/GenericUpsellModal/hooks';

const CustomRoleUpsellModal = ({ onClose }: { onClose: () => void }) => {
	const { t } = useTranslation();
	const { handleManageSubscription } = useUpsellActions();

	return (
		<GenericUpsellModal
			aria-label={t('Custom_roles')}
			img='images/custom-role-upsell-modal.png'
			title={t('Custom_roles')}
			subtitle={t('Custom_roles_upsell_add_custom_roles_workspace')}
			description={t('Custom_roles_upsell_add_custom_roles_workspace_description')}
			onClose={onClose}
			onConfirm={handleManageSubscription}
			onCancel={onClose}
		/>
	);
};

export default CustomRoleUpsellModal;
