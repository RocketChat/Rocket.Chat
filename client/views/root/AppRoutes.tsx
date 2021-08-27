import React, { ReactElement } from 'react';
import { Route, Switch } from 'react-router-dom';
import { useSubscription } from 'use-subscription';

import { appLayout } from '../../lib/appLayout';
import { lazyLayout } from '../../lib/lazyLayout';
import AppLayout from './AppLayout';

const SetupWizardRoute = lazyLayout(() => import('../setupWizard/SetupWizardRoute'));
const MailerUnsubscriptionPage = lazyLayout(() => import('../mailer/MailerUnsubscriptionPage'));
const NotFoundPage = lazyLayout(() => import('../notFound/NotFoundPage'));

const AppRoutes = (): ReactElement => {
	const descriptor = useSubscription(appLayout);

	return (
		<Switch>
			<Route path='/register/:hash' exact>
				<AppLayout template='secretURL' />
			</Route>
			<Route path='/invite/:hash' exact>
				<AppLayout template='invite' />
			</Route>
			<Route path='/setup-wizard/:step?' exact>
				<SetupWizardRoute />
			</Route>
			<Route path='/mailer/unsubscribe/:_id/:createdAt' exact>
				<MailerUnsubscriptionPage />
			</Route>
			<Route path='*'>{descriptor ? <AppLayout {...descriptor} /> : <NotFoundPage />}</Route>
		</Switch>
	);
};

export default AppRoutes;
