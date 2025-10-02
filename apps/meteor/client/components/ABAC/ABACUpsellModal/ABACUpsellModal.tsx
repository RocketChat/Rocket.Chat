import { useSetModal } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { getURL } from '../../../../app/utils/client';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import GenericUpsellModal from '../../GenericUpsellModal';
import { useUpsellActions } from '../../GenericUpsellModal/hooks';

const ABACUpsellModal = () => {
	const { t } = useTranslation();

	// @ts-expect-error - abac license module is yet to be implemented
	const hasABAC = useHasLicenseModule('abac') === true;

	const setModal = useSetModal();
	const { handleManageSubscription } = useUpsellActions(hasABAC);

	return (
		<GenericUpsellModal
			tagline={t('Premium_capability')}
			title={t('Attribute_based_access_control')}
			subtitle={t('Attribute_based_access_control_title')}
			description={t('Attribute_based_access_control_description')}
			img={getURL('images/abac-upsell-modal.svg')}
			onClose={() => setModal(null)}
			onConfirm={handleManageSubscription}
			onCancel={() => setModal(null)}
			imgHeight={256}
		/>
	);
};

export default ABACUpsellModal;
