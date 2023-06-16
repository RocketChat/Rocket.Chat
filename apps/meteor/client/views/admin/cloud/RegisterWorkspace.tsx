import { Box, Tag } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import React from 'react';

import Page from '../../../components/Page';
import ManualWorkspaceRegistrationModal from './ManualWorkspaceRegistrationModal';
import RegisterWorkspaceCards from './components/RegisterWorkspaceCards';
import RegisterWorkspaceMenu from './components/RegisterWorkspaceMenu';
import ConnectWorkspaceModal from './modals/ConnectWorkspaceModal';
import RegisterWorkspaceModal from './modals/RegisterWorkspaceModal';

const RegisterWorkspace = (): ReactNode => {
	const t = useTranslation();
	const setModal = useSetModal();

	const checkCloudRegisterStatus = useMethod('cloud:checkRegisterStatus');
	const result = useQuery(['admin/cloud/register-status'], async () => checkCloudRegisterStatus());
	const reload = useMutableCallback(() => result.refetch());

	if (result.isLoading || result.isError) {
		return null;
	}

	const { connectToCloud: isConnectedToCloud, workspaceRegistered: isWorkspaceRegistered } = result.data;

	const handleRegisterWorkspaceClick = (): void => {
		const handleModalClose = (): void => {
			setModal(null);
			reload();
		};
		if (isWorkspaceRegistered) {
			setModal(<ConnectWorkspaceModal onClose={handleModalClose} onStatusChange={reload} />);
		} else setModal(<RegisterWorkspaceModal onClose={handleModalClose} onStatusChange={reload} />);
	};

	const handleManualWorkspaceRegistrationButton = (): void => {
		const handleModalClose = (): void => {
			setModal(null);
			reload();
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
					onStatusChange={reload}
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
