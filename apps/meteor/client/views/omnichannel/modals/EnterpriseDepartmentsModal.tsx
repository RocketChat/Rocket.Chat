import { Box, ModalHeroImage } from '@rocket.chat/fuselage';
import { useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { GenericModal } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useExternalLink } from '../../../hooks/useExternalLink';
import { useCheckoutUrl } from '../../admin/subscription/hooks/useCheckoutUrl';

// This seems a upSell modal for enterprise feature
const EnterpriseDepartmentsModal = ({ closeModal }: { closeModal: () => void }) => {
	const { t } = useTranslation();
	const router = useRouter();
	const ref = useRef<HTMLDivElement>(null);

	const openExternalLink = useExternalLink();
	const manageSubscriptionUrl = useCheckoutUrl()({ target: 'new-departments-page', action: 'upgrade' });

	const goToManageSubscriptionPage = (): void => {
		openExternalLink(manageSubscriptionUrl);
		closeModal();
	};

	const onClose = (): void => {
		router.navigate('/omnichannel/departments');
		closeModal();
	};

	useOutsideClick([ref], onClose);

	return (
		<GenericModal
			variant='upsell'
			title={t('Departments')}
			tagline={t('Premium_capability')}
			onClose={onClose}
			onCancel={onClose}
			onConfirm={goToManageSubscriptionPage}
			cancelText={t('Cancel')}
			confirmText={t('Upgrade')}
		>
			<div ref={ref}>
				<ModalHeroImage src='/images/departments.svg' />
				<Box fontScale='h3' marginBlockEnd={28}>
					{t('Premium_Departments_title')}
				</Box>
				{t('Premium_Departments_description_upgrade')}
			</div>
		</GenericModal>
	);
};

export default EnterpriseDepartmentsModal;
