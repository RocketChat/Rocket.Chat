import { Button, Box } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../components/GenericModal';
import { useExternalLink } from '../../../hooks/useExternalLink';
import { useCheckoutUrl } from '../../admin/subscription/hooks/useCheckoutUrl';

const EnterpriseDepartmentsModal = ({ closeModal }: { closeModal: () => void }): ReactElement => {
	const { t } = useTranslation();
	const router = useRouter();

	const openExternalLink = useExternalLink();
	const manageSubscriptionUrl = useCheckoutUrl()({
		target: 'new-departments-page',
		action: 'upgrade',
	});

	const onClose = (): void => {
		router.navigate('/omnichannel/departments');
		closeModal();
	};

	const onUpgrade = (): void => {
		openExternalLink(manageSubscriptionUrl);
		closeModal();
	};

	return (
		<GenericModal
			variant='info'
			icon='department'
			title={t('Departments')}
			subtitle={t('Premium_capability')}
			onClose={onClose}
			confirmText={t('Upgrade')}
			cancelText={t('Cancel')}
			onConfirm={onUpgrade}
			onCancel={onClose}
		>
			<Box mbe={28} fontScale='h3'>
				{t('Premium_Departments_title')}
			</Box>
			{t('Premium_Departments_description_upgrade')}
		</GenericModal>
	);
};

export default EnterpriseDepartmentsModal;
