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
	const isConnectedToCloud = registrationStatusData?.registrationStatus?.connectToCloud ?? false;

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

	const handleRegistrationTag = () => {
		if (!isWorkspaceRegistered && !isConnectedToCloud) {
			return <Tag variant='secondary-danger'>{t('RegisterWorkspace_NotRegistered_Title')}</Tag>;
		}
		if (isWorkspaceRegistered && !isConnectedToCloud) {
			return <Tag variant='secondary-danger'>{t('RegisterWorkspace_NotConnected_Title')}</Tag>;
		}
		return <Tag variant='primary'>{t('Workspace_registered')}</Tag>;
	};

	const handleCardsTitle = () => {
		if (!isWorkspaceRegistered && !isConnectedToCloud) {
			return t('RegisterWorkspace_NotRegistered_Subtitle');
		}
		if (isWorkspaceRegistered && !isConnectedToCloud) {
			return t('RegisterWorkspace_NotConnected_Subtitle');
		}
		return t('RegisterWorkspace_Registered_Description');
	};

	return (
		<Page background='tint'>
			<Page.Header title={t('Registration')}>
				<RegisterWorkspaceMenu
					isWorkspaceRegistered={isWorkspaceRegistered}
					isConnectedToCloud={isConnectedToCloud}
					onClick={handleRegisterWorkspaceClick}
					onStatusChange={refetch}
					onClickOfflineRegistration={handleManualWorkspaceRegistrationButton}
				/>
			</Page.Header>

			<Page.ScrollableContentWithShadow>
				<Box display='flex'>{handleRegistrationTag()}</Box>

				<Box pb={8}>
					<Box fontSize='h3' fontWeight={700}>
						{handleCardsTitle()}
					</Box>
					<RegisterWorkspaceCards />
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default RegisterWorkspace;
