import { useSessionDispatch, useRouteParameter, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';
import { useQuery } from 'react-query';

import { KonchatNotification } from '../../../app/ui';
import { call } from '../../lib/utils/call';
import LoginPage from '../root/MainLayout/LoginPage';
import PageLoading from '../root/PageLoading';

const SecretURLPage = (): ReactElement => {
	const t = useTranslation();

	const hash = useRouteParameter('hash');
	const registrationForm = useSetting('Accounts_RegistrationForm');
	const setLoginDefaultState = useSessionDispatch('loginDefaultState');

	const { isLoading, data } = useQuery(
		['secretURL', hash],
		async () => {
			if (registrationForm !== 'Secret URL' || !hash) {
				return false;
			}

			return call('checkRegistrationSecretURL', hash);
		},
		{
			onSuccess: (valid) => {
				if (!valid) {
					return;
				}

				setLoginDefaultState('register');
				KonchatNotification.getDesktopPermission();
			},
		},
	);

	if (isLoading) {
		return <PageLoading />;
	}

	if (data) {
		return <LoginPage />;
	}

	return (
		<section className='rc-old full-page color-tertiary-font-color'>
			<div className='wrapper'>
				<header>
					<a className='logo' href='/'>
						<img src='images/logo/logo.svg?v=3' />
					</a>
				</header>
				<div className='content'>
					<div className='attention-message'>
						<i className='icon-attention'></i>
						{t('Invalid_secret_URL_message')}
					</div>
				</div>
			</div>
		</section>
	);
};

export default SecretURLPage;
