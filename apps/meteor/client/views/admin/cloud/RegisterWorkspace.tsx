import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Box, Tag } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import {
	useSetModal,
	useToastMessageDispatch,
	useQueryStringParameter,
	useMethod,
	useTranslation,
} from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import Page from '../../../components/Page';
import RegisterWorkspaceMenu from './components/RegisterWorkspaceMenu';
import RegisterWorkspaceCards from './components/RegisterWorkspaceCards';
import RegisterWorkspaceModal from './modals/WorkspaceRegistrationModal';

const RegisterWorkspace = (): ReactNode => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const token = useQueryStringParameter('token');

	const checkCloudRegisterStatus = useMethod('cloud:checkRegisterStatus');
	const result = useQuery(['admin/cloud/register-status'], async () => checkCloudRegisterStatus());
	const reload = useMutableCallback(() => result.refetch());

	const connectWorkspace = useMethod('cloud:connectWorkspace');

	const setModal = useSetModal();

	useEffect(() => {
		const acceptWorkspaceToken = async (): Promise<void> => {
			try {
				if (token) {
					const isConnected = await connectWorkspace(token);

					if (!isConnected) {
						throw Error(t('An error occured connecting' as Parameters<typeof t>[0]));
					}

					dispatchToastMessage({ type: 'success', message: t('Connected') });
				}
			} catch (error: unknown) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				reload();
			}
		};

		acceptWorkspaceToken();
	}, [reload, connectWorkspace, dispatchToastMessage, t, token]);

	const handleRegisterWorkspaceClick = (): void => {
		const handleModalClose = (): void => {
			setModal(null);
			reload();
		};
		setModal(<RegisterWorkspaceModal onClose={handleModalClose} />);
	};

	if (result.isLoading || result.isError) {
		return null;
	}

	const {
		connectToCloud: isConnectToCloudDesired,
		workspaceRegistered: isWorkspaceRegistered,
	} = result.data;

	console.log('connect', isConnectToCloudDesired, 'workspaceRegistered', isWorkspaceRegistered, 'result.data', result.data)

	return (
		<Page background='tint'>
			<Page.Header title={t('Registration')}>
				<RegisterWorkspaceMenu isWorkspaceRegistered={isWorkspaceRegistered} onClick={handleRegisterWorkspaceClick} />
			</Page.Header>
			
			<Page.ScrollableContentWithShadow>
				{isWorkspaceRegistered ? (
					<Tag variant='primary'>{t('RegisterWorkspace_Registered_Title')}</Tag>
				) : (
					<Tag variant='secondary-danger'>{t('RegisterWorkspace_NotRegistered_Title')}</Tag>
				)}
				
				<Box pb={8}>
					<Box fontSize='h3' fontWeight={700}>{
						isWorkspaceRegistered ? t('RegisterWorkspace_Registered_Description') : t('RegisterWorkspace_NotRegistered_Description')
					}</Box>
					<RegisterWorkspaceCards />
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default RegisterWorkspace;
