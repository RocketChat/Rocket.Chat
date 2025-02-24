import type { IOAuthApps, IUser } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { Form } from '@rocket.chat/layout';
import { useLogout, useRoute } from '@rocket.chat/ui-contexts';
import { Accounts } from 'meteor/accounts-base';
import { useEffect, useId, useMemo, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import CurrentUserDisplay from './CurrentUserDisplay';
import Layout from './Layout';
import { queueMicrotask } from '../../../lib/utils/queueMicrotask';

type AuthorizationFormPageProps = {
	oauthApp: IOAuthApps;
	redirectUri: string;
	user: IUser;
};

const AuthorizationFormPage = ({ oauthApp, redirectUri, user }: AuthorizationFormPageProps) => {
	const token = useMemo(() => Accounts.storageLocation.getItem(Accounts.LOGIN_TOKEN_KEY) ?? undefined, []);

	const formLabelId = useId();

	const { t } = useTranslation();

	const homeRoute = useRoute('home');

	const handleCancelButtonClick = () => {
		queueMicrotask(() => {
			homeRoute.push();
		});
		window.close();
	};

	const logout = useLogout();

	const handleLogoutButtonClick = () => {
		logout();
	};

	const submitRef = useRef<HTMLButtonElement>(null);

	const hasAuthorized = user.oauth?.authorizedClients?.includes(oauthApp.clientId);

	useEffect(() => {
		if (hasAuthorized) {
			submitRef.current?.click();
		}
	}, [oauthApp.clientId, hasAuthorized]);

	return (
		<Layout>
			<Form method='post' action='' aria-labelledby={formLabelId}>
				<Form.Header>
					<Form.Title id={formLabelId}>{t('core.Authorize_access_to_your_account')}</Form.Title>
				</Form.Header>
				<Form.Container>
					<Box withRichContent>
						<CurrentUserDisplay user={user} />

						<p>
							<Trans i18nKey='core.OAuth_Full_Access_Warning' t={t} values={{ appName: oauthApp.name }}>
								<strong>{oauthApp.name}</strong>
							</Trans>
						</p>
					</Box>
					<input type='hidden' name='access_token' value={token} />
					<input type='hidden' name='client_id' value={oauthApp.clientId} />
					<input type='hidden' name='redirect_uri' value={redirectUri} />
					<input type='hidden' name='response_type' value='code' />
				</Form.Container>
				<Form.Footer>
					<ButtonGroup stretch>
						<Button ref={submitRef} type='submit' primary name='allow' value='yes'>
							{t('core.Authorize')}
						</Button>
						<Button onClick={handleCancelButtonClick}>{t('core.Cancel')}</Button>
						<Button danger onClick={handleLogoutButtonClick}>
							{t('core.Logout')}
						</Button>
					</ButtonGroup>
				</Form.Footer>
			</Form>
		</Layout>
	);
};

export default AuthorizationFormPage;
