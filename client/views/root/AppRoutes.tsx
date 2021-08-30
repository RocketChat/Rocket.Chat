import React, { Fragment, ReactElement } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { useSubscription } from 'use-subscription';

import { appLayout } from '../../lib/appLayout';
import { lazyLayout, lazyMainLayout } from '../../lib/lazyLayout';
import { blazePortals } from '../../lib/portals/blazePortals';
import AppLayout from './AppLayout';
import BlazeTemplate from './BlazeTemplate';

const DirectoryPage = lazyMainLayout('DirectoryPage', () => import('../directory/DirectoryPage'));
const OmnichannelDirectoryPage = lazyMainLayout(
	'OmnichannelDirectoryPage',
	() => import('../omnichannel/directory/OmnichannelDirectoryPage'),
);
const AccountRoute = lazyMainLayout('AccountRoute', () => import('../account/AccountRoute'));
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
				<Route exact path='/directory/:tab?'>
					<DirectoryPage />
				</Route>
				<Route exact path='/omnichannel-directory/:page?/:bar?/:id?/:tab?/:context?'>
					<OmnichannelDirectoryPage />
				</Route>
				<Route exact path='/account/:group?'>
					<AccountRoute />
				</Route>
				<Route exact path='/terms-of-service'>
					<AppLayout template='cmsPage' cmsPage='Layout_Terms_of_Service' />
				</Route>
				<Route exact path='/privacy-policy'>
					<AppLayout template='cmsPage' cmsPage='Layout_Privacy_Policy' />
				</Route>
				<Route exact path='/legal-notice'>
					<AppLayout template='cmsPage' cmsPage='Layout_Legal_Notice' />
				</Route>
				<Route exact path='/room-not-found/:type/:name'>
					{({ match }): ReactElement => (
						<AppLayout
							template='main'
							center='roomNotFound'
							type={match?.params.type}
							name={match?.params.name}
						/>
					)}
				</Route>
				<Route exact path='/register/:hash'>
					<AppLayout template='secretURL' />
				</Route>
				<Route exact path='/invite/:hash'>
					<AppLayout template='invite' />
				</Route>
				<Route exact path='/setup-wizard/:step?'>
					<SetupWizardRoute />
				</Route>
				<Route exact path='/mailer/unsubscribe/:_id/:createdAt'>
					<MailerUnsubscriptionPage />
				</Route>
				<Route exact path='/reset-password/:token'>
					<AppLayout template='loginLayout' center='resetPassword' />
				</Route>
				<Route>{!descriptor && <NotFoundPage />}</Route>
			</Switch>
		</>
	);
};

export default AppRoutes;
