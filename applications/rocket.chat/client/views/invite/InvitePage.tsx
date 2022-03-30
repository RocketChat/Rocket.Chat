import React, { ReactElement } from 'react';
import { useQuery } from 'react-query';

import { APIClient } from '../../../app/utils/client';
import { OperationParams, OperationResult } from '../../../definition/rest';
import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import { useSessionDispatch } from '../../contexts/SessionContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useUserId } from '../../contexts/UserContext';
import PageLoading from '../root/PageLoading';

const InvitePage = (): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const token = useRouteParameter('hash');
	const registrationForm = useSetting('Accounts_RegistrationForm');
	const setLoginDefaultState = useSessionDispatch('loginDefaultState');
	const userId = useUserId();
	const homeRoute = useRoute('/');
	const groupRoute = useRoute('/group/:name/:tab?/:context?');
	const channelRoute = useRoute('/channel/:name/:tab?/:context?');

	const { isLoading } = useQuery(
		['invite', token],
		async () => {
			if (!token) {
				return false;
			}

			try {
				const { valid } = await APIClient.v1.post<
					OperationParams<'POST', '/v1/validateInviteToken'>,
					never,
					OperationResult<'POST', '/v1/validateInviteToken'>
				>('validateInviteToken', { token });

				return valid;
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: t('Failed_to_validate_invite_token') });
				return false;
			}
		},
		{
			onSuccess: async (valid) => {
				if (!token) {
					return;
				}

				if (registrationForm !== 'Disabled') {
					setLoginDefaultState('register');
				} else {
					setLoginDefaultState('login');
				}

				if (!valid || !userId) {
					return;
				}

				try {
					const result = await APIClient.v1.post<
						OperationParams<'POST', '/v1/useInviteToken'>,
						never,
						OperationResult<'POST', '/v1/useInviteToken'>
					>('useInviteToken', { token });
					if (!result?.room.name) {
						dispatchToastMessage({ type: 'error', message: t('Failed_to_activate_invite_token') });
						homeRoute.push();
						return;
					}

					if (result.room.t === 'p') {
						groupRoute.push({ name: result.room.name });
						return;
					}

					channelRoute.push({ name: result.room.name });
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: t('Failed_to_activate_invite_token') });
					homeRoute.push();
				}
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
						{t('Invalid_or_expired_invite_token')}
					</div>
				</div>
			</div>
		</section>
	);
};

export default InvitePage;
