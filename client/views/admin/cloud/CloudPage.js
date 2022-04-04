import { Box, Button, ButtonGroup, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback, useSafely } from '@rocket.chat/fuselage-hooks';
import React, { useState, useEffect } from 'react';

import Page from '../../../components/Page';
import { useSetModal } from '../../../contexts/ModalContext';
import { useQueryStringParameter, useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useMethod } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import ConnectToCloudSection from './ConnectToCloudSection';
import ManualWorkspaceRegistrationModal from './ManualWorkspaceRegistrationModal';
import TroubleshootingSection from './TroubleshootingSection';
import WhatIsItSection from './WhatIsItSection';
import WorkspaceLoginSection from './WorkspaceLoginSection';
import WorkspaceRegistrationSection from './WorkspaceRegistrationSection';
import { cloudConsoleUrl } from './constants';

function CloudPage() {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const cloudRoute = useRoute('cloud');

	const page = useRouteParameter('page');

	const errorCode = useQueryStringParameter('error_code');
	const code = useQueryStringParameter('code');
	const state = useQueryStringParameter('state');
	const token = useQueryStringParameter('token');

	const finishOAuthAuthorization = useMethod('cloud:finishOAuthAuthorization');
	const checkRegisterStatus = useMethod('cloud:checkRegisterStatus');
	const connectWorkspace = useMethod('cloud:connectWorkspace');

	useEffect(() => {
		const acceptOAuthAuthorization = async () => {
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

	const [registerStatus, setRegisterStatus] = useSafely(useState());
	const setModal = useSetModal();

	const fetchRegisterStatus = useMutableCallback(async () => {
		try {
			const registerStatus = await checkRegisterStatus();
			setRegisterStatus(registerStatus);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	useEffect(() => {
		const acceptWorkspaceToken = async () => {
			try {
				if (token) {
					const isConnected = await connectWorkspace(token);

					if (!isConnected) {
						throw Error(t('An error occured connecting'));
					}

					dispatchToastMessage({ type: 'success', message: t('Connected') });
				}
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				await fetchRegisterStatus();
			}
		};

		acceptWorkspaceToken();
	}, [connectWorkspace, dispatchToastMessage, fetchRegisterStatus, t, token]);

	const handleManualWorkspaceRegistrationButtonClick = () => {
		const handleModalClose = () => {
			setModal(null);
			fetchRegisterStatus();
		};
		setModal(<ManualWorkspaceRegistrationModal onClose={handleModalClose} />);
	};

	const isConnectToCloudDesired = registerStatus?.connectToCloud;
	const isWorkspaceRegistered = registerStatus?.workspaceRegistered;

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
										<WorkspaceLoginSection onRegisterStatusChange={fetchRegisterStatus} />
										<TroubleshootingSection onRegisterStatusChange={fetchRegisterStatus} />
									</>
								) : (
									<WorkspaceRegistrationSection
										email={registerStatus?.email}
										token={registerStatus?.token}
										workspaceId={registerStatus?.workspaceId}
										uniqueId={registerStatus?.uniqueId}
										onRegisterStatusChange={fetchRegisterStatus}
									/>
								)}
							</>
						)}

						{!isConnectToCloudDesired && <ConnectToCloudSection onRegisterStatusChange={fetchRegisterStatus} />}
					</Margins>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
}

export default CloudPage;
