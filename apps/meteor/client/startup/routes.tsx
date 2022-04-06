import type { IUser } from '@rocket.chat/core-typings';
import { Accounts } from 'meteor/accounts-base';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import React, { lazy } from 'react';
import toastr from 'toastr';

import { KonchatNotification } from '../../app/ui/client';
import { APIClient } from '../../app/utils/client';
import { appLayout } from '../lib/appLayout';
import { createTemplateForComponent } from '../lib/portals/createTemplateForComponent';
import { dispatchToastMessage } from '../lib/toast';
import { handleError } from '../lib/utils/handleError';

const InvitePage = lazy(() => import('../views/invite/InvitePage'));
const SecretURLPage = lazy(() => import('../views/invite/SecretURLPage'));
const CMSPage = lazy(() => import('../views/root/CMSPage'));
const ResetPasswordPage = lazy(() => import('../views/login/ResetPassword/ResetPassword'));
const SetupWizardRoute = lazy(() => import('../views/setupWizard/SetupWizardRoute'));
const MailerUnsubscriptionPage = lazy(() => import('../views/mailer/MailerUnsubscriptionPage'));
const NotFoundPage = lazy(() => import('../views/notFound/NotFoundPage'));
const MeetPage = lazy(() => import('../views/meet/MeetPage'));

FlowRouter.wait();

FlowRouter.route('/', {
	name: 'index',
	action() {
		appLayout.renderMainLayout({ center: 'loading' });
		if (!Meteor.userId()) {
			return FlowRouter.go('home');
		}

		Tracker.autorun((c) => {
			if (FlowRouter.subsReady() === true) {
				Meteor.defer(() => {
					const user = Meteor.user() as IUser | null;
					if (user?.defaultRoom) {
						const room = user.defaultRoom.split('/');
						FlowRouter.go(room[0], { name: room[1] }, FlowRouter.current().queryParams);
					} else {
						FlowRouter.go('home');
					}
				});
				c.stop();
			}
		});
	},
});

FlowRouter.route('/login', {
	name: 'login',

	action() {
		FlowRouter.go('home');
	},
});

FlowRouter.route('/meet/:rid', {
	name: 'meet',

	async action(_params, queryParams) {
		if (queryParams?.token !== undefined) {
			// visitor login
			const visitor = await APIClient.v1.get(`livechat/visitor/${queryParams?.token}`);
			if (visitor?.visitor) {
				appLayout.render(<MeetPage />);
				return;
			}

			toastr.error(TAPi18n.__('Visitor_does_not_exist'));
			return;
		}

		if (!Meteor.userId()) {
			FlowRouter.go('home');
			return;
		}

		appLayout.render(<MeetPage />);
	},
});

FlowRouter.route('/home', {
	name: 'home',

	action(_params, queryParams) {
		KonchatNotification.getDesktopPermission();
		if (queryParams?.saml_idp_credentialToken !== undefined) {
			const token = queryParams.saml_idp_credentialToken;
			FlowRouter.setQueryParams({
				// eslint-disable-next-line @typescript-eslint/camelcase
				saml_idp_credentialToken: null,
			});
			(Meteor as any).loginWithSamlToken(token, (error?: any) => {
				if (error) {
					if (error.reason) {
						dispatchToastMessage({ type: 'error', message: error.reason });
					} else {
						handleError(error);
					}
				}

				appLayout.renderMainLayout({ center: 'home' });
			});

			return;
		}

		appLayout.renderMainLayout({ center: 'home' });
	},
});

FlowRouter.route('/directory/:tab?', {
	name: 'directory',
	action: () => {
		const DirectoryPage = createTemplateForComponent('DirectoryPage', () => import('../views/directory/DirectoryPage'), {
			attachment: 'at-parent',
		});
		appLayout.renderMainLayout({ center: DirectoryPage });
	},
});

FlowRouter.route('/omnichannel-directory/:page?/:bar?/:id?/:tab?/:context?', {
	name: 'omnichannel-directory',
	action: () => {
		const OmnichannelDirectoryPage = createTemplateForComponent(
			'OmnichannelDirectoryPage',
			() => import('../views/omnichannel/directory/OmnichannelDirectoryPage'),
			{ attachment: 'at-parent' },
		);
		appLayout.renderMainLayout({ center: OmnichannelDirectoryPage });
	},
});

FlowRouter.route('/livechat-queue', {
	name: 'livechat-queue',
	action: () => {
		const OmnichannelQueueList = createTemplateForComponent('QueueList', () => import('../views/omnichannel/queueList'), {
			attachment: 'at-parent',
		});
		appLayout.renderMainLayout({ center: OmnichannelQueueList });
	},
});

FlowRouter.route('/account/:group?', {
	name: 'account',
	action: () => {
		const AccountRoute = createTemplateForComponent('AccountRoute', () => import('../views/account/AccountRoute'), {
			attachment: 'at-parent',
		});
		appLayout.renderMainLayout({ center: AccountRoute });
	},
});

FlowRouter.route('/terms-of-service', {
	name: 'terms-of-service',
	action: () => {
		appLayout.render(<CMSPage page='Layout_Terms_of_Service' />);
	},
});

FlowRouter.route('/privacy-policy', {
	name: 'privacy-policy',
	action: () => {
		appLayout.render(<CMSPage page='Layout_Privacy_Policy' />);
	},
});

FlowRouter.route('/legal-notice', {
	name: 'legal-notice',
	action: () => {
		appLayout.render(<CMSPage page='Layout_Legal_Notice' />);
	},
});

FlowRouter.route('/room-not-found/:type/:name', {
	name: 'room-not-found',
	action: ({ type, name } = {}) => {
		Session.set('roomNotFound', { type, name });
		appLayout.renderMainLayout({ center: 'roomNotFound' });
	},
});

FlowRouter.route('/register/:hash', {
	name: 'register-secret-url',
	action: () => {
		appLayout.render(<SecretURLPage />);
	},
});

FlowRouter.route('/invite/:hash', {
	name: 'invite',
	action: () => {
		appLayout.render(<InvitePage />);
	},
});

FlowRouter.route('/setup-wizard/:step?', {
	name: 'setup-wizard',
	action: () => {
		appLayout.render(<SetupWizardRoute />);
	},
});

FlowRouter.route('/mailer/unsubscribe/:_id/:createdAt', {
	name: 'mailer-unsubscribe',
	action: () => {
		appLayout.render(<MailerUnsubscriptionPage />);
	},
});

FlowRouter.route('/login-token/:token', {
	name: 'tokenLogin',
	action(params) {
		Accounts.callLoginMethod({
			methodArguments: [
				{
					loginToken: params?.token,
				},
			],
			userCallback(error) {
				console.error(error);
				FlowRouter.go('/');
			},
		});
	},
});

FlowRouter.route('/reset-password/:token', {
	name: 'resetPassword',
	action() {
		appLayout.render(<ResetPasswordPage />);
	},
});

FlowRouter.route('/snippet/:snippetId/:snippetName', {
	name: 'snippetView',
	action() {
		appLayout.renderMainLayout({ center: 'snippetPage' });
	},
});

FlowRouter.route('/oauth/authorize', {
	name: 'oauth/authorize',
	action(_params, queryParams) {
		appLayout.renderMainLayout({
			center: 'authorize',
			modal: true,
			// eslint-disable-next-line @typescript-eslint/camelcase
			client_id: queryParams?.client_id,
			// eslint-disable-next-line @typescript-eslint/camelcase
			redirect_uri: queryParams?.redirect_uri,
			// eslint-disable-next-line @typescript-eslint/camelcase
			response_type: queryParams?.response_type,
			state: queryParams?.state,
		});
	},
});

FlowRouter.route('/oauth/error/:error', {
	name: 'oauth/error',
	action(params) {
		appLayout.renderMainLayout({
			center: 'oauth404',
			modal: true,
			error: params?.error,
		});
	},
});

FlowRouter.notFound = {
	action: (): void => {
		appLayout.render(<NotFoundPage />);
	},
};

Meteor.startup(() => {
	FlowRouter.initialize();
});
