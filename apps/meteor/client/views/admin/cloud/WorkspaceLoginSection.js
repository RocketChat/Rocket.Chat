import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, useEffect } from 'react';

function WorkspaceLoginSection({ onRegisterStatusChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const checkUserLoggedIn = useMethod('cloud:checkUserLoggedIn');
	const getOAuthAuthorizationUrl = useMethod('cloud:getOAuthAuthorizationUrl');
	const logout = useMethod('cloud:logout');
	const disconnectWorkspace = useMethod('cloud:disconnectWorkspace');

	const [isLoggedIn, setLoggedIn] = useSafely(useState(false));
	const [isLoading, setLoading] = useSafely(useState(true));

	const handleLoginButtonClick = async () => {
		setLoading(true);

		try {
			const url = await getOAuthAuthorizationUrl();
			window.location.href = url;
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setLoading(false);
		}
	};

	const handleLogoutButtonClick = async () => {
		setLoading(true);

		try {
			await logout();
			const isLoggedIn = await checkUserLoggedIn();
			setLoggedIn(isLoggedIn);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setLoading(false);
		}
	};

	const handleDisconnectButtonClick = async () => {
		setLoading(true);

		try {
			const success = await disconnectWorkspace();

			if (!success) {
				throw Error(t('An error occured disconnecting'));
			}

			dispatchToastMessage({ type: 'success', message: t('Disconnected') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			await (onRegisterStatusChange && onRegisterStatusChange());
			setLoading(false);
		}
	};

	useEffect(() => {
		const checkLoginState = async () => {
			setLoading(true);

			try {
				const isLoggedIn = await checkUserLoggedIn();
				setLoggedIn(isLoggedIn);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setLoading(false);
			}
		};

		checkLoginState();
	}, [checkUserLoggedIn, dispatchToastMessage, setLoading, setLoggedIn]);

	return (
		<Box is='section' {...props}>
			<Box withRichContent color='neutral-800'>
				<p>{t('Cloud_workspace_connected')}</p>
			</Box>

			<ButtonGroup>
				{isLoggedIn ? (
					<Button primary danger disabled={isLoading} onClick={handleLogoutButtonClick}>
						{t('Cloud_logout')}
					</Button>
				) : (
					<Button primary disabled={isLoading} onClick={handleLoginButtonClick}>
						{t('Cloud_login_to_cloud')}
					</Button>
				)}
			</ButtonGroup>

			<Box withRichContent color='neutral-800'>
				<p>{t('Cloud_workspace_disconnect')}</p>
			</Box>

			<ButtonGroup>
				<Button primary danger disabled={isLoading} onClick={handleDisconnectButtonClick}>
					{t('Disconnect')}
				</Button>
			</ButtonGroup>
		</Box>
	);
}

export default WorkspaceLoginSection;
