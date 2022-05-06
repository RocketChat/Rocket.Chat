import { Box, Button, ButtonGroup, Margins } from '@rocket.chat/fuselage';
import {
	useSetModal,
	useToastMessageDispatch,
	useQueryStringParameter,
	useRoute,
	useRouteParameter,
	useMethod,
	useTranslation,
} from '@rocket.chat/ui-contexts';
import React, { useEffect, ReactNode } from 'react';

import Page from '../../../components/Page';
import { useMethodData } from '../../../hooks/useMethodData';
import ConnectToCloudSection from './ConnectToCloudSection';
import ManualWorkspaceRegistrationModal from './ManualWorkspaceRegistrationModal';
import TroubleshootingSection from './TroubleshootingSection';
import WhatIsItSection from './WhatIsItSection';
import WorkspaceLoginSection from './WorkspaceLoginSection';
import WorkspaceRegistrationSection from './WorkspaceRegistrationSection';
import { cloudConsoleUrl } from './constants';

const args: [] = [];

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

	const { reload, ...checkRegisterStatus } = useMethodData('cloud:checkRegisterStatus', args);

	useEffect(() => {
		console.log('checkRegisterStatus', checkRegisterStatus);
	}, [checkRegisterStatus]);

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
			} catch (error) {
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
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				await reload();
			}
		};

		acceptWorkspaceToken();
	}, [reload, connectWorkspace, dispatchToastMessage, t, token]);

	const handleManualWorkspaceRegistrationButtonClick = (): void => {
		const handleModalClose = (): void => {
			setModal(null);
			reload();
		};
		setModal(<ManualWorkspaceRegistrationModal onClose={handleModalClose} />);
	};

	if (checkRegisterStatus.phase === 'loading') {
		return null;
	}

	if (checkRegisterStatus.phase === 'rejected') {
		return null;
	}

	const isConnectToCloudDesired = checkRegisterStatus.value.connectToCloud;
	const isWorkspaceRegistered = checkRegisterStatus.value.workspaceRegistered;

	return (
		<Page>
			<Page.Header title={t('Connectivity_Services')}>
				<ButtonGroup>
					{!isWorkspaceRegistered && <Button onClick={handleManualWorkspaceRegistrationButtonClick}>{t('Cloud_Register_manually')}</Button>}
					<Button is='a' primary href={cloudConsoleUrl} target='_blank' rel='noopener noreferrer'>
						{t('Cloud_console')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<Box marginInline='auto' marginBlock='neg-x24' width='full' maxWidth='x580'>
					<Margins block='x24'>
						<WhatIsItSection />

						{isConnectToCloudDesired && (
							<>
								{isWorkspaceRegistered ? (
									<>
										<WorkspaceLoginSection onRegisterStatusChange={reload} />
										<TroubleshootingSection onRegisterStatusChange={reload} />
									</>
								) : (
									<WorkspaceRegistrationSection
										email={checkRegisterStatus.value.email}
										token={checkRegisterStatus.value.token}
										workspaceId={checkRegisterStatus.value.workspaceId}
										uniqueId={checkRegisterStatus.value.uniqueId}
										onRegisterStatusChange={reload}
									/>
								)}
							</>
						)}

						{!isConnectToCloudDesired && <ConnectToCloudSection onRegisterStatusChange={reload} />}
					</Margins>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default CloudPage;
