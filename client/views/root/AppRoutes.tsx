import React, { Fragment, ReactElement } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { useSubscription } from 'use-subscription';

import { appLayout } from '../../lib/appLayout';
import { lazyLayout } from '../../lib/lazyLayout';
import { blazePortals } from '../../lib/portals/blazePortals';
import AppLayout from './AppLayout';
import BlazeTemplate from './BlazeTemplate';

const SetupWizardRoute = lazyLayout(() => import('../setupWizard/SetupWizardRoute'));
const MailerUnsubscriptionPage = lazyLayout(() => import('../mailer/MailerUnsubscriptionPage'));
const NotFoundPage = lazyLayout(() => import('../notFound/NotFoundPage'));

const AppRoutes = (): ReactElement => {
	const descriptor = useSubscription(appLayout);
	const portals = useSubscription(blazePortals);

	return (
		<>
			{descriptor && (
				<>
					<BlazeTemplate {...descriptor} />
					{portals.map(({ key, node }) => (
						<Fragment key={key} children={node} />
					))}
				</>
			)}
			<Switch>
				<Redirect exact path='/' to='/home' />
				<Redirect exact path='/login' to='/home' />
				<Route exact path='/register/:hash'>
					<AppLayout template='secretURL' />
				</Route>
				<Route exact path='/invite/:hash'>
					<AppLayout template='invite' />
				</Route>
				<Route exact path='/setup-wizard/:step?'>
					<SetupWizardRoute />
					<AppLayout />
				</Route>
				<Route exact path='/mailer/unsubscribe/:_id/:createdAt'>
					<MailerUnsubscriptionPage />
					<AppLayout />
				</Route>
				<Route>
					{!descriptor && (
						<>
							<NotFoundPage />
							<AppLayout />
						</>
					)}
				</Route>
			</Switch>
		</>
	);
};

export default AppRoutes;
