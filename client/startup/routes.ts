import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { lazy } from 'react';
import toastr from 'toastr';

import { KonchatNotification } from '../../app/ui/client';
import { handleError } from '../../app/utils/client';
import { IUser } from '../../definition/IUser';
import { appLayout } from '../lib/appLayout';
import { createTemplateForComponent } from '../lib/portals/createTemplateForComponent';

const SetupWizardRoute = lazy(() => import('../views/setupWizard/SetupWizardRoute'));
const MailerUnsubscriptionPage = lazy(() => import('../views/mailer/MailerUnsubscriptionPage'));
const NotFoundPage = lazy(() => import('../views/notFound/NotFoundPage'));

FlowRouter.wait();

FlowRouter.route('/', {
	name: 'index',
	action() {
		appLayout.render('main', { center: 'loading' });
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
						toastr.error(error.reason);
					} else {
						handleError(error);
					}
				}

				appLayout.render('main', { center: 'home' });
			});

			return;
		}

		appLayout.render('main', { center: 'home' });
	},
});

FlowRouter.route('/directory/:tab?', {
	name: 'directory',
	action: () => {
		const DirectoryPage = createTemplateForComponent(
			'DirectoryPage',
			() => import('../views/directory/DirectoryPage'),
			{ attachment: 'at-parent' },
		);
		appLayout.render('main', { center: DirectoryPage });
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
		appLayout.render('main', { center: OmnichannelDirectoryPage });
	},
});

FlowRouter.route('/account/:group?', {
	name: 'account',
	action: () => {
		const AccountRoute = createTemplateForComponent(
			'AccountRoute',
			() => import('../views/account/AccountRoute'),
			{ attachment: 'at-parent' },
		);
		appLayout.render('main', { center: AccountRoute });
	},
});

FlowRouter.route('/terms-of-service', {
	name: 'terms-of-service',
	action: () => {
		Session.set('cmsPage', 'Layout_Terms_of_Service');
		appLayout.render('cmsPage');
	},
});

FlowRouter.route('/privacy-policy', {
	name: 'privacy-policy',
	action: () => {
		Session.set('cmsPage', 'Layout_Privacy_Policy');
		appLayout.render('cmsPage');
	},
});

FlowRouter.route('/legal-notice', {
	name: 'legal-notice',
	action: () => {
		Session.set('cmsPage', 'Layout_Legal_Notice');
		appLayout.render('cmsPage');
	},
});

FlowRouter.route('/room-not-found/:type/:name', {
	name: 'room-not-found',
	action: ({ type, name } = {}) => {
		Session.set('roomNotFound', { type, name });
		appLayout.render('main', { center: 'roomNotFound' });
	},
});

FlowRouter.route('/register/:hash', {
	name: 'register-secret-url',
	action: () => {
		appLayout.render('secretURL');
	},
});

FlowRouter.route('/invite/:hash', {
	name: 'invite',
	action: () => {
		appLayout.render('invite');
	},
});

FlowRouter.route('/setup-wizard/:step?', {
	name: 'setup-wizard',
	action: () => {
		appLayout.render({ component: SetupWizardRoute });
	},
});

FlowRouter.route('/mailer/unsubscribe/:_id/:createdAt', {
	name: 'mailer-unsubscribe',
	action: () => {
		appLayout.render({ component: MailerUnsubscriptionPage });
	},
});

FlowRouter.notFound = {
	action: (): void => {
		appLayout.render({ component: NotFoundPage });
	},
};

Meteor.startup(() => {
	FlowRouter.initialize();
});
