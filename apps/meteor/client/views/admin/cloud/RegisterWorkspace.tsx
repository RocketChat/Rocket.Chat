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

	const { isRegistered, isLoading, isError, refetch } = useRegistrationStatus();

	if (isLoading || isError) {
		return null;
	}

	const handleRegisterWorkspaceClick = (): void => {
		const handleModalClose = (): void => {
			setModal(null);
			refetch();
		};
		if (isRegistered) {
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
					isWorkspaceRegistered={isRegistered || false}
					onClick={handleRegisterWorkspaceClick}
					onStatusChange={refetch}
					onClickOfflineRegistration={handleManualWorkspaceRegistrationButton}
				/>
			</Page.Header>

			<Page.ScrollableContentWithShadow>
				<Box display='flex'>
					{!isRegistered && <Tag variant='secondary-danger'>{t('RegisterWorkspace_NotRegistered_Title')}</Tag>}
					{isRegistered && <Tag variant='primary'>{t('Workspace_registered')}</Tag>}
				</Box>

				<Box pb={8}>
					<Box fontScale='h3'>
						{!isRegistered && t('RegisterWorkspace_NotRegistered_Subtitle')}
						{isRegistered && t('RegisterWorkspace_Registered_Description')}
					</Box>
					<RegisterWorkspaceCards />
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default RegisterWorkspace;
