import {
	Button,
	Modal,
	Box,
	ModalHeader,
	ModalHeaderText,
	ModalTagline,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalHeroImage,
	ModalFooter,
	ModalFooterControllers,
} from '@rocket.chat/fuselage';
import { useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useExternalLink } from '../../../hooks/useExternalLink';
import { useCheckoutUrl } from '../../admin/subscription/hooks/useCheckoutUrl';

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
			<ModalHeader>
				<ModalHeaderText>
					<ModalTagline>{t('Premium_capability')}</ModalTagline>
					<ModalTitle>{t('Departments')}</ModalTitle>
				</ModalHeaderText>
				<ModalClose onClick={onClose} data-qa='modal-close' />
			</ModalHeader>
			<ModalContent fontScale='p2'>
				<ModalHeroImage src='/images/departments.svg' />
				<Box fontScale='h3' mbe={28}>
					{t('Premium_Departments_title')}
				</Box>
				{t('Premium_Departments_description_upgrade')}
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>

					<Button onClick={goToManageSubscriptionPage} primary>
						{t('Upgrade')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default EnterpriseDepartmentsModal;
