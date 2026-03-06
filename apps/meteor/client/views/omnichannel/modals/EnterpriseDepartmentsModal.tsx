import { Box } from '@rocket.chat/fuselage';
import { useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import GenericUpsellModal from '../../../components/GenericUpsellModal';
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
			<GenericUpsellModal
				title={t('Departments')}
				img='/images/departments.svg'
				subtitle={t('Premium_Departments_title')}
				description={t('Premium_Departments_description_upgrade')}
				cancelText={t('Cancel')}
				onCancel={onClose}
				onClose={onClose}
				onConfirm={goToManageSubscriptionPage}
			/>
		</Box>
	);
};

export default EnterpriseDepartmentsModal;
