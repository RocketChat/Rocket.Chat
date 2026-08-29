import { useTranslation } from 'react-i18next';

import { getURL } from '../../../app/utils/client';
import GenericUpsellModal from '../../components/GenericUpsellModal';

export type CustomCategoryUpsellModalProps = {
	onClose: () => void;
	onConfirm: () => void;
};

const CustomCategoryUpsellModal = ({ onClose, onConfirm }: CustomCategoryUpsellModalProps) => {
	const { t } = useTranslation();

	return (
		<GenericUpsellModal
			tagline={t('Premium_capability')}
			title={t('Custom_categories')}
			subtitle={t('Custom_categories_subtitle')}
			description={t('Custom_categories_description')}
			img={getURL('images/custom-categories.png')}
			onClose={onClose}
			onConfirm={onConfirm}
			onCancel={onClose}
			imgHeight={256}
		/>
	);
};

export default CustomCategoryUpsellModal;
