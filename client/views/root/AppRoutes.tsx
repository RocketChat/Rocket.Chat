import React, { ReactElement } from 'react';
import { Route, Switch } from 'react-router-dom';

import { lazyLayout } from '../../lib/lazyLayout';

const SetupWizardRoute = lazyLayout(() => import('../setupWizard/SetupWizardRoute'));
const MailerUnsubscriptionPage = lazyLayout(() => import('../mailer/MailerUnsubscriptionPage'));
const NotFoundPage = lazyLayout(() => import('../notFound/NotFoundPage'));

const AppRoutes = (): ReactElement => (
	<Switch>
		<Route path='/setup-wizard/:step?' exact>
			<SetupWizardRoute />
		</Route>
		<Route path='/mailer/unsubscribe/:_id/:createdAt' exact>
			<MailerUnsubscriptionPage />
		</Route>
		<Route path='*'>
			<NotFoundPage />
		</Route>
	</Switch>
);

export default AppRoutes;
