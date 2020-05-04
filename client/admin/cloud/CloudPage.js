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
import Subtitle from '../../components/basic/Subtitle';

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
	const syncWorkspace = useMethod('cloud:syncWorkspace');
	const registerWorkspace = useMethod('cloud:registerWorkspace');
	const updateEmail = useMethod('cloud:updateEmail');

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

	const handleEmailChange = ({ currentTarget: { value } }) => {
		setRegisterStatus((info) => ({ ...info, email: value }));
	};

	const handleUpdateEmailButtonClick = async () => {
		try {
			await updateEmail(registerStatus.email, false);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleResendEmailButtonClick = async () => {
		try {
			await updateEmail(registerStatus.email, true);
			dispatchToastMessage({ type: 'success', message: t('Requested') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleTokenChange = ({ currentTarget: { value } }) => {
		setRegisterStatus((info) => ({ ...info, token: value }));
	};

	const handleConnectButtonClick = async () => {
		try {
			const isConnected = await connectWorkspace(registerStatus.token);

			if (!isConnected) {
				throw Error(t('An error occured connecting'));
			}

			dispatchToastMessage({ type: 'success', message: t('Connected') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			await loadRegisterStatus();
		}
	};

	const handleRegisterButtonClick = async () => {
		try {
			const isRegistered = await registerWorkspace();

			if (!isRegistered) {
				throw Error(t('An error occured'));
			}

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

	return <div className='main-content-flex'>
		<Page>
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
						<Box is='section'>
							<Subtitle>{t('Cloud_what_is_it')}</Subtitle>

							<Box withRichContent>
								<p>{t('Cloud_what_is_it_description')}</p>

								<details>
									<p>{t('Cloud_what_is_it_services_like')}</p>

									<ul>
										<li>{t('Register_Server_Registered_Push_Notifications')}</li>
										<li>{t('Register_Server_Registered_Livechat')}</li>
										<li>{t('Register_Server_Registered_OAuth')}</li>
										<li>{t('Register_Server_Registered_Marketplace')}</li>
									</ul>

									<p>{t('Cloud_what_is_it_additional')}</p>
								</details>
							</Box>
						</Box>

						<Box is='section'>
							{registerStatus?.connectToCloud
								? <>
									{registerStatus?.workspaceRegistered ? <>
										<div className='section-content border-component-color'>
											<p>{t('Cloud_workspace_connected')}</p>
											<div className='input-line double-col'>
												{isLoggedIn
													? <>
														<label className='setting-label' title=''></label>
														<div className='setting-field'>
															<button type='button' className='rc-button rc-button--primary action logout-btn' onClick={handleLogoutButtonClick}>{t('Cloud_logout')}</button>
														</div>
													</>
													: <>
														<label className='setting-label' title=''></label>
														<div className='setting-field'>
															<button type='button' className='rc-button rc-button--primary action login-btn' onClick={handleLoginButtonClick}>{t('Cloud_login_to_cloud')}</button>
														</div>
													</>}
											</div>
										</div>

										<div className='section-content border-component-color'>
											<p>{t('Cloud_workspace_disconnect')}</p>
											<div className='input-line double-col'>
												<label className='setting-label' title=''></label>
												<div className='setting-field'>
													<button type='button' className='rc-button rc-button--danger action disconnect-btn' onClick={handleDisconnectButtonClick}>{t('Disconnect')}</button>
												</div>
											</div>
										</div>
									</>
										: <>
											<div className='section-content border-component-color'>
												<div className='input-line double-col'>
													<label className='setting-label' title='cloudEmail'>{t('Email')}</label>
													<div className='setting-field'>
														<input className='input-monitor rc-input__element' type='text' name='cloudEmail' value={registerStatus?.email} onChange={handleEmailChange} />
														<div className='settings-description secondary-font-color'>{t('Cloud_address_to_send_registration_to')}</div>
													</div>
												</div>
												<div className='input-line double-col'>
													<label className='setting-label' title=''></label>
													<div className='setting-field'>
														<button type='button' className='rc-button rc-button--primary action update-email-btn' onClick={handleUpdateEmailButtonClick} style={{ float: 'left' }}>{t('Cloud_update_email')}</button>
														<button type='button' className='rc-button rc-button--primary action resend-email-btn' onClick={handleResendEmailButtonClick} style={{ float: 'left', marginLeft: 5 }}>{t('Cloud_resend_email')}</button>
													</div>
												</div>

												<div className='input-line double-col'>
													<label className='setting-label' title='cloudToken'>{t('Token')}</label>
													<div className='setting-field'>
														<input className='input-monitor rc-input__element' type='text' name='cloudToken' value={registerStatus?.token} onChange={handleTokenChange} />
														<div className='settings-description secondary-font-color'>{t('Cloud_manually_input_token')}</div>
													</div>
												</div>
												<div className='input-line double-col'>
													<label className='setting-label' title=''></label>
													<div className='setting-field'>
														<button type='button' className='rc-button rc-button--primary action connect-btn' onClick={handleConnectButtonClick}>{t('Connect')}</button>
													</div>
												</div>

												<p>{t('Cloud_connect_support')}: <a href={`mailto:support@rocket.chat?subject=[Self Hosted Registration]&body=WorkspaceId: ${ registerStatus?.workspaceId }%0D%0ADeployment Id: ${ registerStatus?.uniqueId }%0D%0AIssue: <please describe your issue here>`}>support@rocket.chat</a></p>
											</div>
										</>}
								</>
								: <>
									<div className='section-title'>
										<div className='section-title-text'>
											{t('Cloud_registration_required')}
										</div>
									</div>
									<div className='section-content border-component-color'>
										<p>{t('Cloud_registration_required_description')}</p>
										<button type='button' className='rc-button rc-button--primary action register-btn' onClick={handleRegisterButtonClick}>{t('Cloud_registration_requried_link_text')}</button>
									</div>
								</>}
						</Box>
						{registerStatus?.connectToCloud && <Box is='section'>
							<div className='section-title'>
								<div className='section-title-text'>
									{t('Cloud_troubleshooting')}
								</div>
							</div>

							<div className='section-content border-component-color'>
								<p>{t('Cloud_workspace_support')}</p>
								<div className='input-line double-col'>
									<label className='setting-label' title=''></label>
									<div className='setting-field'>
										<button type='button' className='rc-button rc-button--danger action sync-btn' onClick={handleSyncButtonClick}>{t('Sync')}</button>
									</div>
								</div>
							</div>

							<div className='section-content'>
								{t('Cloud_status_page_description')}: <a href='https://status.rocket.chat' target='_blank'>status.rocket.chat</a>
							</div>
						</Box>}
					</Margins>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	</div>;
}

export default CloudPage;
