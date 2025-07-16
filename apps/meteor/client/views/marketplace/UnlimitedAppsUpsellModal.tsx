import { useTranslation } from 'react-i18next';

import GenericUpsellModal from '../../components/GenericUpsellModal';
import { useUpsellActions } from '../../components/GenericUpsellModal/hooks';

const UnlimitedAppsUpsellModal = ({ onClose }: { onClose: () => void }) => {
	const { t } = useTranslation();
	const { handleManageSubscription, cloudWorkspaceHadTrial } = useUpsellActions();

	return (
		<GenericUpsellModal
			title={t('Enable_unlimited_apps')}
			img='images/unlimited-apps-modal.png'
			subtitle={t('Get_all_apps')}
			description={!cloudWorkspaceHadTrial ? t('Workspaces_on_community_edition_trial_on') : t('Workspaces_on_community_edition_trial_off')}
			onConfirm={handleManageSubscription}
			onCancel={onClose}
			onClose={onClose}
		/>
	);
};
export default UnlimitedAppsUpsellModal;
