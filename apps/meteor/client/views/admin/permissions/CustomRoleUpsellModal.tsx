import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericUpsellModal from '../../../components/GenericUpsellModal';
import { useUpsellActions } from '../../../components/GenericUpsellModal/hooks';

const CustomRoleUpsellModal = ({ onClose }: { onClose: () => void }) => {
	const t = useTranslation();
	const { cloudWorkspaceHadTrial, handleTalkToSales, handleGoFullyFeatured } = useUpsellActions();

	return (
		<GenericUpsellModal
			aria-label={t('Custom_roles')}
			img='images/custom-role-upsell-modal.png'
			title={t('Custom_roles')}
			subtitle={t('Custom_roles_upsell_add_custom_roles_workspace')}
			description={t('Custom_roles_upsell_add_custom_roles_workspace_description')}
			onClose={onClose}
			cancelText={t('Talk_to_an_expert')}
			confirmText={cloudWorkspaceHadTrial ? t('Learn_more') : t('Start_a_free_trial')}
			onConfirm={handleGoFullyFeatured}
			onCancel={handleTalkToSales}
		/>
	);
};

export default CustomRoleUpsellModal;
