import { useTranslation } from 'react-i18next';

import { getURL } from '../../../../app/utils/client';
import GenericUpsellModal from '../../GenericUpsellModal';

type ABACUpsellModalProps = {
	onClose: () => void;
	onConfirm: () => void;
};

const ABACUpsellModal = ({ onClose, onConfirm }: ABACUpsellModalProps) => {
	const { t } = useTranslation();

	return (
		<GenericUpsellModal
			tagline={t('Premium_capability')}
			title={t('Attribute_based_access_control')}
			subtitle={t('Attribute_based_access_control_title')}
			description={t('Attribute_based_access_control_description')}
			img={getURL('images/abac-upsell-modal.svg')}
			onClose={onClose}
			onConfirm={onConfirm}
			onCancel={onClose}
			imgHeight={256}
		/>
	);
};

export default ABACUpsellModal;
