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
import { useQueryStringParameter } from '../../contexts/RouterContext';
import { useModal } from '../../hooks/useModal';
import WhatIsItSection from './WhatIsItSection';
import ConnectToCloudSection from './ConnectToCloudSection';
import TroubleshootingSection from './TroubleshootingSection';
import WorkspaceRegistrationSection from './WorkspaceRegistrationSection';
import WorkspaceLoginSection from './WorkspaceLoginSection';

function CloudPage() {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const modal = useModal();

	const [registerStatus, setRegisterStatus] = useSafely(useState());
	const [isLoggedIn, setLoggedIn] = useSafely(useState(false));

	const checkRegisterStatus = useMethod('cloud:checkRegisterStatus');
	const checkUserLoggedIn = useMethod('cloud:checkUserLoggedIn');
	const getOAuthAuthorizationUrl = useMethod('cloud:getOAuthAuthorizationUrl');
	const logout = useMethod('cloud:logout');
	const connectWorkspace = useMethod('cloud:connectWorkspace');
	const disconnectWorkspace = useMethod('cloud:disconnectWorkspace');

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

			try {
				const isLoggedIn = await checkUserLoggedIn();
				setLoggedIn(isLoggedIn);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		};

		initialize();
	}, [token]);

	const handleCloudRegisterManuallyButtonClick = () => {
		modal.open({
			template: 'cloudRegisterManually',
			showCancelButton: false,
			showConfirmButton: false,
			showFooter: false,
			closeOnCancel: true,
			html: true,
			confirmOnEnter: false,
		});
	};

	const handleLogoutButtonClick = async () => {
		try {
			await logout();
			const isLoggedIn = await checkUserLoggedIn();
			setLoggedIn(isLoggedIn);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleLoginButtonClick = async () => {
		try {
			const url = await getOAuthAuthorizationUrl();
			window.location.href = url;
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleDisconnectButtonClick = async () => {
		try {
			const success = await disconnectWorkspace();

			if (!success) {
				throw Error(t('An error occured disconnecting'));
			}

			dispatchToastMessage({ type: 'success', message: t('Disconnected') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			await loadRegisterStatus();
		}
	};

	const syncWorkspace = useMethod('cloud:syncWorkspace');

	const handleSyncButtonClick = async () => {
		try {
			const isSynced = await syncWorkspace();

			if (!isSynced) {
				throw Error(t('An error occured syncing'));
			}

			dispatchToastMessage({ type: 'success', message: t('Sync Complete') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			await loadRegisterStatus();
		}
	};

	const registerWorkspace = useMethod('cloud:registerWorkspace');

	const handleRegisterButtonClick = async () => {
		try {
			const isRegistered = await registerWorkspace();

			if (!isRegistered) {
				throw Error(t('An error occured'));
			}

			// TODO: sync on register?
			const isSynced = await syncWorkspace();

			if (!isSynced) {
				throw Error(t('An error occured syncing'));
			}

			dispatchToastMessage({ type: 'success', message: t('Sync Complete') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			await loadRegisterStatus();
		}
	};

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
		<Page.ScrollableContentWithShadow className='page-settings'>
			<Box marginInline='auto' marginBlock='neg-x24' width='full' maxWidth='x580'>
				<Margins block='x24'>
					<WhatIsItSection />

					{registerStatus?.connectToCloud && <>
						{registerStatus?.workspaceRegistered && <WorkspaceLoginSection
							isLoggedIn={isLoggedIn}
							onLoginButtonClick={handleLoginButtonClick}
							onLogoutButtonClick={handleLogoutButtonClick}
							onDisconnectButtonClick={handleDisconnectButtonClick}
						/>}

						{!registerStatus?.workspaceRegistered && <WorkspaceRegistrationSection
							registerStatus={registerStatus}
							onRegisterStatusChange={loadRegisterStatus}
						/>}

						<TroubleshootingSection
							onSyncButtonClick={handleSyncButtonClick}
						/>
					</>}

					{!registerStatus?.connectToCloud && <ConnectToCloudSection
						onRegisterButtonClick={handleRegisterButtonClick}
					/>}
				</Margins>
			</Box>
		</Page.ScrollableContentWithShadow>
	</Page>;
}

export default CloudPage;
