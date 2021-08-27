import React, { ReactElement } from 'react';
import { Route, Switch } from 'react-router-dom';

import { lazyLayout } from '../../lib/lazyLayout';
import AppLayout from './AppLayout';

const SetupWizardRoute = lazyLayout(() => import('../setupWizard/SetupWizardRoute'));
const MailerUnsubscriptionPage = lazyLayout(() => import('../mailer/MailerUnsubscriptionPage'));

const AppRoutes = (): ReactElement => (
	<Switch>
		<Route path='/setup-wizard/:step?' exact>
			<SetupWizardRoute />
		</Route>
		<Route path='/mailer/unsubscribe/:_id/:createdAt' exact>
			<MailerUnsubscriptionPage />
		</Route>
		<Route path='*'>
			<AppLayout />
		</Route>
	</Switch>
);

export default AppRoutes;
