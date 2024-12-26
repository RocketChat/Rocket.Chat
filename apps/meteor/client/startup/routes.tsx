import { createElement, lazy, useEffect } from 'react';

import { appLayout } from '../lib/appLayout';
import { router } from '../providers/RouterProvider';
import MainLayout from '../views/root/MainLayout';

const IndexRoute = lazy(() => import('../views/root/IndexRoute'));
const MeetRoute = lazy(() => import('../views/meet/MeetRoute'));
const HomePage = lazy(() => import('../views/home/HomePage'));
const DirectoryPage = lazy(() => import('../views/directory'));
const OmnichannelDirectoryRouter = lazy(() => import('../views/omnichannel/directory/OmnichannelDirectoryRouter'));
const OmnichannelQueueList = lazy(() => import('../views/omnichannel/queueList'));
const CMSPage = lazy(() => import('@rocket.chat/web-ui-registration').then(({ CMSPage }) => ({ default: CMSPage })));
const SecretURLPage = lazy(() => import('../views/invite/SecretURLPage'));
const InvitePage = lazy(() => import('../views/invite/InvitePage'));
const ConferenceRoute = lazy(() => import('../views/conference/ConferenceRoute'));
const SetupWizardRoute = lazy(() => import('../views/setupWizard/SetupWizardRoute'));
const MailerUnsubscriptionPage = lazy(() => import('../views/mailer/MailerUnsubscriptionPage'));
const LoginTokenRoute = lazy(() => import('../views/root/LoginTokenRoute'));
const SAMLLoginRoute = lazy(() => import('../views/root/SAMLLoginRoute'));
const ResetPasswordPage = lazy(() =>
	import('@rocket.chat/web-ui-registration').then(({ ResetPasswordPage }) => ({ default: ResetPasswordPage })),
);
const OAuthAuthorizationPage = lazy(() => import('../views/oauth/OAuthAuthorizationPage'));
const OAuthErrorPage = lazy(() => import('../views/oauth/OAuthErrorPage'));
const NotFoundPage = lazy(() => import('../views/notFound/NotFoundPage'));

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'index': {
			pathname: '/';
			pattern: '/';
		};
		'login': {
			pathname: '/login';
			pattern: '/login';
		};
		'meet': {
			pathname: `/meet/${string}`;
			pattern: '/meet/:rid';
		};
		'home': {
			pathname: '/home';
			pattern: '/home';
		};
		'directory': {
			pathname: `/directory${`/${'users' | 'channels' | 'teams' | 'external'}` | ''}`;
			pattern: '/directory/:tab?';
		};
		'omnichannel-directory': {
			pathname: `/omnichannel-directory${`/${string}` | ''}${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/omnichannel-directory/:tab?/:context?/:id?/';
		};
		'livechat-queue': {
			pathname: '/livechat-queue';
			pattern: '/livechat-queue';
		};
		'terms-of-service': {
			pathname: '/terms-of-service';
			pattern: '/terms-of-service';
		};
		'privacy-policy': {
			pathname: '/privacy-policy';
			pattern: '/privacy-policy';
		};
		'legal-notice': {
			pathname: '/legal-notice';
			pattern: '/legal-notice';
		};
		'register-secret-url': {
			pathname: `/register/${string}`;
			pattern: '/register/:hash';
		};
		'invite': {
			pathname: `/invite/${string}`;
			pattern: '/invite/:hash';
		};
		'conference': {
			pathname: `/conference/${string}`;
			pattern: '/conference/:id';
		};
		'setup-wizard': {
			pathname: `/setup-wizard${`/${string}` | ''}`;
			pattern: '/setup-wizard/:step?';
		};
		'mailer-unsubscribe': {
			pathname: `/mailer/unsubscribe/${string}/${string}`;
			pattern: '/mailer/unsubscribe/:_id/:createdAt';
		};
		'tokenLogin': {
			pathname: `/login-token/${string}`;
			pattern: '/login-token/:token';
		};
		'resetPassword': {
			pathname: `/reset-password/${string}`;
			pattern: '/reset-password/:token';
		};
		'oauth/authorize': {
			pathname: `/oauth/authorize`;
			pattern: '/oauth/authorize';
		};
		'oauth/error': {
			pathname: `/oauth/error/${string}`;
			pattern: '/oauth/error/:error';
		};
		'saml': {
			pathname: `/saml/${string}`;
			pattern: '/saml/:token';
		};
	}
}

router.defineRoutes([
	{
		path: '/',
		id: 'index',
		element: appLayout.wrap(<IndexRoute />),
	},
	{
		path: '/login',
		id: 'login',
		element: createElement(() => {
			useEffect(() => {
				router.navigate('/home');
			}, []);

			return null;
		}),
	},
	{
		path: '/meet/:rid',
		id: 'meet',
		element: appLayout.wrap(<MeetRoute />),
	},
	{
		path: '/home',
		id: 'home',
		element: appLayout.wrap(
			<MainLayout>
				<HomePage />
			</MainLayout>,
		),
	},
	{
		path: '/directory/:tab?',
		id: 'directory',
		element: appLayout.wrap(
			<MainLayout>
				<DirectoryPage />
			</MainLayout>,
		),
	},
	{
		path: '/omnichannel-directory/:tab?/:context?/:id?/',
		id: 'omnichannel-directory',
		element: appLayout.wrap(
			<MainLayout>
				<OmnichannelDirectoryRouter />
			</MainLayout>,
		),
	},
	{
		path: '/livechat-queue',
		id: 'livechat-queue',
		element: appLayout.wrap(
			<MainLayout>
				<OmnichannelQueueList />
			</MainLayout>,
		),
	},
	{
		path: '/terms-of-service',
		id: 'terms-of-service',
		element: appLayout.wrap(<CMSPage page='Layout_Terms_of_Service' />),
	},
	{
		path: '/privacy-policy',
		id: 'privacy-policy',
		element: appLayout.wrap(<CMSPage page='Layout_Privacy_Policy' />),
	},
	{
		path: '/legal-notice',
		id: 'legal-notice',
		element: appLayout.wrap(<CMSPage page='Layout_Legal_Notice' />),
	},
	{
		path: '/register/:hash',
		id: 'register-secret-url',
		element: appLayout.wrap(<SecretURLPage />),
	},
	{
		path: '/invite/:hash',
		id: 'invite',
		element: appLayout.wrap(<InvitePage />),
	},
	{
		path: '/conference/:id',
		id: 'conference',
		element: appLayout.wrap(<ConferenceRoute />),
	},
	{
		path: '/setup-wizard/:step?',
		id: 'setup-wizard',
		element: <SetupWizardRoute />,
	},
	{
		path: '/mailer/unsubscribe/:_id/:createdAt',
		id: 'mailer-unsubscribe',
		element: appLayout.wrap(<MailerUnsubscriptionPage />),
	},
	{
		path: '/login-token/:token',
		id: 'tokenLogin',
		element: appLayout.wrap(<LoginTokenRoute />),
	},
	{
		path: '/reset-password/:token',
		id: 'resetPassword',
		element: appLayout.wrap(<ResetPasswordPage />),
	},
	{
		path: '/oauth/authorize',
		id: 'oauth/authorize',
		element: appLayout.wrap(<OAuthAuthorizationPage />),
	},
	{
		path: '/oauth/error/:error',
		id: 'oauth/error',
		element: appLayout.wrap(<OAuthErrorPage />),
	},
	{
		path: '/saml/:token',
		id: 'saml',
		element: appLayout.wrap(<SAMLLoginRoute />),
	},
	{
		path: '*',
		id: 'not-found',
		element: <NotFoundPage />,
	},
]);
