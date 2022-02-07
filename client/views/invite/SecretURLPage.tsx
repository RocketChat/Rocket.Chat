import React, { ReactElement } from 'react';
import { useQuery } from 'react-query';

import { KonchatNotification } from '../../../app/ui';
import { useRouteParameter } from '../../contexts/RouterContext';
import { useSessionDispatch } from '../../contexts/SessionContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { call } from '../../lib/utils/call';
import PageLoading from '../root/PageLoading';

const SecretURLPage = (): ReactElement => {
	const t = useTranslation();

	const hash = useRouteParameter('hash');
	const registrationForm = useSetting('Accounts_RegistrationForm');
	const setLoginDefaultState = useSessionDispatch('loginDefaultState');

	const { isLoading } = useQuery(
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
