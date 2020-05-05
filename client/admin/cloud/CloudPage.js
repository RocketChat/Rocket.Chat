import {
	Box,
	Button,
	ButtonGroup,
	Margins,
} from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import React, { useState, useEffect } from 'react';

import Page from '../../components/basic/Page';
import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useQueryStringParameter, useRoute, useRouteParameter } from '../../contexts/RouterContext';
import WhatIsItSection from './WhatIsItSection';
import ConnectToCloudSection from './ConnectToCloudSection';
import TroubleshootingSection from './TroubleshootingSection';
import WorkspaceRegistrationSection from './WorkspaceRegistrationSection';
import WorkspaceLoginSection from './WorkspaceLoginSection';
import ManualWorkspaceRegistrationModal from './ManualWorkspaceRegistrationModal';

function CloudPage() {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const page = useRouteParameter('page');

	const errorCode = useQueryStringParameter('error_code');
	const code = useQueryStringParameter('code');
	const state = useQueryStringParameter('state');

	const finishOAuthAuthorization = useMethod('cloud:finishOAuthAuthorization');
	const cloudRoute = useRoute('cloud');

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
	}, [errorCode, code, state]);

	const checkRegisterStatus = useMethod('cloud:checkRegisterStatus');
	const connectWorkspace = useMethod('cloud:connectWorkspace');

	const [registerStatus, setRegisterStatus] = useSafely(useState());
	const [modal, setModal] = useState(null);

	const token = useQueryStringParameter('token');

	const loadRegisterStatus = async () => {
		try {
			const registerStatus = await checkRegisterStatus();
			setRegisterStatus(registerStatus);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	useEffect(() => {
		const initialize = async () => {
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
				await loadRegisterStatus();
			}
		};

		initialize();
	}, [token]);

	const handleCloudRegisterManuallyButtonClick = () => {
		const handleModalClose = () => {
			setModal(null);
		};
		setModal(<ManualWorkspaceRegistrationModal onClose={handleModalClose} />);
	};

	const isConnectedToCloud = registerStatus?.connectToCloud;
	const isWorkspaceRegistered = registerStatus?.workspaceRegistered;

	return <Page>
		<Page.Header title={t('Connectivity_Services')}>
			<ButtonGroup>
				{!registerStatus?.workspaceRegistered && <Button onClick={handleCloudRegisterManuallyButtonClick}>
					{t('Cloud_Register_manually')}
				</Button>}
				<Button is='a' primary href='https://cloud.rocket.chat' target='_blank' rel='noopener noreferrer'>
					{t('Cloud_console')}
				</Button>
			</ButtonGroup>
		</Page.Header>
		{modal}
		<Page.ScrollableContentWithShadow>
			<Box marginInline='auto' marginBlock='neg-x24' width='full' maxWidth='x580'>
				<Margins block='x24'>
					<WhatIsItSection />

					{isConnectedToCloud && <>
						{isWorkspaceRegistered
							? <WorkspaceLoginSection onRegisterStatusChange={loadRegisterStatus} />
							: <WorkspaceRegistrationSection
								email={registerStatus?.email}
								token={registerStatus?.token}
								workspaceId={registerStatus?.workspaceId}
								uniqueId={registerStatus?.uniqueId}
								onRegisterStatusChange={loadRegisterStatus}
							/>}

						<TroubleshootingSection onRegisterStatusChange={loadRegisterStatus} />
					</>}

					{!isConnectedToCloud && <ConnectToCloudSection onRegisterStatusChange={loadRegisterStatus} />}
				</Margins>
			</Box>
		</Page.ScrollableContentWithShadow>
	</Page>;
}

export default CloudPage;
