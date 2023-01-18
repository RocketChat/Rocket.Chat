import { Box, Tag } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import {
	useSetModal,
	useToastMessageDispatch,
	useQueryStringParameter,
	useRoute,
	useRouteParameter,
	useMethod,
	useTranslation,
} from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import React, { useEffect } from 'react';

import Page from '../../../components/Page';
import RegisterWorkspaceMenu from './components/RegisterWorkspaceMenu';
import RegisterWorkspaceCards from './components/RegisterWorkspaceCards';
import RegisterWorkspaceModal from './modals/WorkspaceRegistrationModal';

const CloudPage = function CloudPage(): ReactNode {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const cloudRoute = useRoute('cloud');

	const page = useRouteParameter('page');

	const errorCode = useQueryStringParameter('error_code');
	const code = useQueryStringParameter('code');
	const state = useQueryStringParameter('state');
	const token = useQueryStringParameter('token');

	const finishOAuthAuthorization = useMethod('cloud:finishOAuthAuthorization');

	const checkCloudRegisterStatus = useMethod('cloud:checkRegisterStatus');
	const result = useQuery(['admin/cloud/register-status'], async () => checkCloudRegisterStatus());
	const reload = useMutableCallback(() => result.refetch());

	const connectWorkspace = useMethod('cloud:connectWorkspace');

	useEffect(() => {
		const acceptOAuthAuthorization = async (): Promise<void> => {
			if (page !== 'oauth-callback') {
				return;
			}

			if (errorCode) {
				dispatchToastMessage({
					type: 'error',
					title: t('Cloud_error_in_authenticating'),
					message: t('Cloud_error_code', { errorCode }),
				});
				cloudRoute.push();
				return;
			}

			try {
				await finishOAuthAuthorization(code, state);
			} catch (error: unknown) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				cloudRoute.push();
			}
		};

		acceptOAuthAuthorization();
	}, [errorCode, code, state, page, dispatchToastMessage, t, cloudRoute, finishOAuthAuthorization]);

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
					<Tag variant='primary'>Workspace registered</Tag>
				) : (
					<Tag variant='secondary-danger'>Workspace not registered</Tag>
				)}
				
				<Box pb={8}>
					<Box fontSize='h3' fontWeight={700}>{
						isWorkspaceRegistered ? 'These services are available' : 'Benefits of registering workspace'
					}</Box>
					<RegisterWorkspaceCards />
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default CloudPage;
