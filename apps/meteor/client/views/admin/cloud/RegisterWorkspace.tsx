import { Box, Tag } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import Page from '../../../components/Page';
import { useRegistrationStatus } from '../../../hooks/useRegistrationStatus';
import ManualWorkspaceRegistrationModal from './ManualWorkspaceRegistrationModal';
import RegisterWorkspaceCards from './components/RegisterWorkspaceCards';
import RegisterWorkspaceMenu from './components/RegisterWorkspaceMenu';
import ConnectWorkspaceModal from './modals/ConnectWorkspaceModal';
import RegisterWorkspaceModal from './modals/RegisterWorkspaceModal';

const RegisterWorkspace = () => {
	const t = useTranslation();
	const setModal = useSetModal();

	const { data: registrationStatusData, isLoading, isError, refetch } = useRegistrationStatus();
	const isWorkspaceRegistered = registrationStatusData?.registrationStatus?.workspaceRegistered ?? false;

	if (isLoading || isError) {
		return null;
	}

	const handleRegisterWorkspaceClick = (): void => {
		const handleModalClose = (): void => {
			setModal(null);
			refetch();
		};
		if (isWorkspaceRegistered) {
			setModal(<ConnectWorkspaceModal onClose={handleModalClose} onStatusChange={refetch} />);
		} else setModal(<RegisterWorkspaceModal onClose={handleModalClose} onStatusChange={refetch} />);
	};

	const handleManualWorkspaceRegistrationButton = (): void => {
		const handleModalClose = (): void => {
			setModal(null);
			refetch();
		};
		setModal(<ManualWorkspaceRegistrationModal onClose={handleModalClose} />);
	};

	return (
		<Page background='tint'>
			<Page.Header title={t('Registration')}>
				<RegisterWorkspaceMenu
					isWorkspaceRegistered={isWorkspaceRegistered}
					onClick={handleRegisterWorkspaceClick}
					onStatusChange={refetch}
					onClickOfflineRegistration={handleManualWorkspaceRegistrationButton}
				/>
			</Page.Header>

			<Page.ScrollableContentWithShadow>
				<Box display='flex'>
					{!isWorkspaceRegistered && <Tag variant='secondary-danger'>{t('RegisterWorkspace_NotRegistered_Title')}</Tag>}
					{isWorkspaceRegistered && <Tag variant='primary'>{t('Workspace_registered')}</Tag>}
				</Box>

				<Box pb={8}>
					<Box fontScale='h3'>
						{!isWorkspaceRegistered && t('RegisterWorkspace_NotRegistered_Subtitle')}
						{isWorkspaceRegistered && t('RegisterWorkspace_Registered_Description')}
					</Box>
					<RegisterWorkspaceCards />
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default RegisterWorkspace;
