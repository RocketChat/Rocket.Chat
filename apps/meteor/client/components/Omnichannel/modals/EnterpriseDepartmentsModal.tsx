import { Button, Modal, Box } from '@rocket.chat/fuselage';
import { useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useExternalLink } from '../../../hooks/useExternalLink';
import { useCheckoutUrl } from '../../../views/admin/subscription/hooks/useCheckoutUrl';

const EnterpriseDepartmentsModal = ({ closeModal }: { closeModal: () => void }): ReactElement => {
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
		<Modal data-qa-id='enterprise-departments-modal' ref={ref}>
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Tagline>{t('Premium_capability')}</Modal.Tagline>
					<Modal.Title>{t('Departments')}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={onClose} data-qa='modal-close' />
			</Modal.Header>
			<Modal.Content fontScale='p2'>
				<Modal.HeroImage src='/images/departments.svg' />
				<Box fontScale='h3' mbe={28}>
					{t('Premium_Departments_title')}
				</Box>
				{t('Premium_Departments_description_upgrade')}
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>

					<Button onClick={goToManageSubscriptionPage} primary data-qa-id='upgrade-now'>
						{t('Upgrade')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default EnterpriseDepartmentsModal;
