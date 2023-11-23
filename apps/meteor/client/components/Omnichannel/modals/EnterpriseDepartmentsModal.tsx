import { Button, Modal, Box } from '@rocket.chat/fuselage';
import { useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useRef } from 'react';

import { hasPermission } from '../../../../app/authorization/client';

const EnterpriseDepartmentsModal = ({ closeModal }: { closeModal: () => void }): ReactElement => {
	const t = useTranslation();
	const router = useRouter();
	const ref = useRef<HTMLDivElement>(null);
	const goToManageSubscriptionPage = (): void => {
		router.navigate('/admin/subscription');
		closeModal();
	};

	const onClose = (): void => {
		router.navigate('/omnichannel/departments');
		closeModal();
	};

	const talkToExpertLink =
		'https://www.rocket.chat/sales-contact?utm_source=rocketchat_app&utm_medium=multiple_queues&utm_campaign=in_product_ctas';

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
				{hasPermission('view-statistics') ? (
					<Modal.FooterControllers>
						<Button is='a' href={talkToExpertLink} external onClick={onClose} data-qa-id='btn-talk-to-sales'>
							{t('Talk_to_an_expert')}
						</Button>

						<Button onClick={goToManageSubscriptionPage} primary data-qa-id='upgrade-now'>
							{t('Learn_more')}
						</Button>
					</Modal.FooterControllers>
				) : (
					<Box display='flex' width='100%' justifyContent='space-between' alignItems='center'>
						Talk to your workspace admin about enabling departments.
						<Button onClick={onClose} data-qa='button-close'>
							{t('Close')}
						</Button>
					</Box>
				)}
			</Modal.Footer>
		</Modal>
	);
};

export default EnterpriseDepartmentsModal;
