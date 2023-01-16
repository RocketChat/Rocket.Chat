import { Button, Modal, Box } from '@rocket.chat/fuselage';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useUpgradeTabParams } from '../../../views/hooks/useUpgradeTabParams';

const EnterpriseDepartmentsModal = ({ closeModal }: { closeModal: () => void }): ReactElement => {
	const t = useTranslation();
	const upgradeRoute = useRoute('upgrade');
	const departmentsRoute = useRoute('omnichannel-departments');
	const { tabType, trialEndDate } = useUpgradeTabParams();

	const upgradeNowClick = (): void => {
		tabType && upgradeRoute.push({ type: tabType }, trialEndDate ? { trialEndDate } : undefined);
		closeModal();
	};

	const onClose = (): void => {
		departmentsRoute.push({});
		closeModal();
	};

	return (
		<>
			<Modal>
				<Modal.Header>
					<Modal.HeaderText>
						<Modal.Tagline>{t('Enterprise_capability')}</Modal.Tagline>
						<Modal.Title>{t('Departments')}</Modal.Title>
					</Modal.HeaderText>
					<Modal.Close onClick={onClose} />
				</Modal.Header>
				<Modal.Content fontScale='p2'>
					<Modal.HeroImage src='/images/departments.svg' />
					<Box fontSize={20} fontWeight={700} lineHeight={28} mbe={28}>
						{t('Enterprise_Departments_title')}
					</Box>
					{t('Enterprise_Departments_description')}
				</Modal.Content>
				<Modal.Footer>
					<Modal.FooterControllers>
						<Button is='a' href='https://rocket.chat/contact' external onClick={onClose}>
							{t('Talk_to_sales')}
						</Button>
						<Button onClick={upgradeNowClick} primary>
							{t('Upgrade_now')}
						</Button>
					</Modal.FooterControllers>
				</Modal.Footer>
			</Modal>
		</>
	);
};

export default EnterpriseDepartmentsModal;
