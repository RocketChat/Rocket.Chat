import { ModalHeroImage, Box } from '@rocket.chat/fuselage';
import { useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { GenericModal } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useExternalLink } from '../../../hooks/useExternalLink';
import { useCheckoutUrl } from '../../admin/subscription/hooks/useCheckoutUrl';

const EnterpriseDepartmentsModal = ({ closeModal }: { closeModal: () => void }): ReactElement => {
	const { t } = useTranslation();
	const router = useRouter();
	const ref = useRef<HTMLElement>(null);

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
		<Box ref={ref}>
			<GenericModal
				variant='upsell'
				tagline={t('Premium_capability')}
				title={t('Departments')}
				cancelText={t('Cancel')}
				confirmText={t('Upgrade')}
				onCancel={onClose}
				onConfirm={goToManageSubscriptionPage}
			>
				<ModalHeroImage src='/images/departments.svg' />
				<Box fontScale='h3' mbe={28}>
					{t('Premium_Departments_title')}
				</Box>
				{t('Premium_Departments_description_upgrade')}
			</GenericModal>
		</Box>
	);
};

export default EnterpriseDepartmentsModal;
