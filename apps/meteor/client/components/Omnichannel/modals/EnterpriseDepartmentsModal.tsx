import { Button, Modal, Box } from '@rocket.chat/fuselage';
import { useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useRef } from 'react';

import { hasPermission } from '../../../../app/authorization/client';
import { useUpgradeTabParams } from '../../../views/hooks/useUpgradeTabParams';

const EnterpriseDepartmentsModal = ({ closeModal }: { closeModal: () => void }): ReactElement => {
	const t = useTranslation();
	const upgradeRoute = useRoute('upgrade');
	const departmentsRoute = useRoute('omnichannel-departments');
	const { tabType, trialEndDate } = useUpgradeTabParams();
	const ref = useRef<HTMLDivElement>(null);
	const upgradeNowClick = (): void => {
		tabType && upgradeRoute.push({ type: tabType }, trialEndDate ? { trialEndDate } : undefined);
		closeModal();
	};

	const onClose = (): void => {
		departmentsRoute.push({});
		closeModal();
	};

	const isTypeUpgradeYourPlan = ['go-fully-featured', 'go-fully-featured-registered'].includes(tabType || '');

	const talkToExpertLink =
		'https://www.rocket.chat/sales-contact?utm_source=rocketchat_app&utm_medium=multiple_queues&utm_campaign=in_product_ctas';

	const freeTrialLink =
		'https://www.rocket.chat/trial-saas?utm_source=rocketchat_app&utm_medium=multiple_queues&utm_campaign=in_product_ctas';

	useOutsideClick([ref], onClose);

	return (
		<Modal data-qa-id='enterprise-departments-modal' ref={ref}>
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Tagline>{t('Enterprise_capability')}</Modal.Tagline>
					<Modal.Title>{t('Departments')}</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close onClick={onClose} data-qa='modal-close' />
			</Modal.Header>
			<Modal.Content fontScale='p2'>
				<Modal.HeroImage src='/images/departments.svg' />
				<Box fontScale='h3' mbe={28}>
					{t('Enterprise_Departments_title')}
				</Box>
				{isTypeUpgradeYourPlan ? t('Enterprise_Departments_description_free_trial') : t('Enterprise_Departments_description_upgrade')}
			</Modal.Content>
			<Modal.Footer>
				{hasPermission('view-statistics') ? (
					<Modal.FooterControllers>
						<Button is='a' href={talkToExpertLink} external onClick={onClose} data-qa-id='btn-talk-to-sales'>
							{t('Talk_to_an_expert')}
						</Button>
						{isTypeUpgradeYourPlan ? (
							<Button is='a' href={freeTrialLink} external primary data-qa-id='upgrade-now'>
								{t('Start_free_trial')}
							</Button>
						) : (
							<Button onClick={upgradeNowClick} primary data-qa-id='upgrade-now'>
								{t('Learn_more')}
							</Button>
						)}
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
