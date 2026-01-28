import { ModalHeroImage, ModalTagline, Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useExternalLink } from '../../../hooks/useExternalLink';
import { useCheckoutUrl } from '../../admin/subscription/hooks/useCheckoutUrl';


const EnterpriseDepartmentsModal = ({ closeModal }: { closeModal: () => void }): ReactElement => {
	const { t } = useTranslation();
	const router = useRouter();

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

	return (
		<GenericModal
			variant='warning'
			title={t('Departments')}
			onConfirm={goToManageSubscriptionPage}
			onCancel={onClose}
			onClose={onClose}
			confirmText={t('Upgrade')}
		>
			<ModalTagline>{t('Premium_capability')}</ModalTagline>
			<ModalHeroImage src='/images/departments.svg' />
			<Box fontScale='h3' mbe={28}>
				{t('Premium_Departments_title')}
			</Box>
			{t('Premium_Departments_description_upgrade')}
		</GenericModal>
	);
};

export default EnterpriseDepartmentsModal;
