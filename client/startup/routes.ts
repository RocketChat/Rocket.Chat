import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import toastr from 'toastr';

import { KonchatNotification } from '../../app/ui/client';
import { handleError } from '../../app/utils/client';
import { appLayout } from '../lib/appLayout';
import { createTemplateForComponent } from '../lib/portals/createTemplateForComponent';

FlowRouter.wait();

FlowRouter.route('/', {
	name: 'index',
	action: () => undefined,
});

FlowRouter.route('/login', {
	name: 'login',
	action: () => undefined,
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
	action: () => undefined,
});

FlowRouter.route('/invite/:hash', {
	name: 'invite',
	action: () => undefined,
});

FlowRouter.route('/setup-wizard/:step?', {
	name: 'setup-wizard',
	action: () => undefined,
});

FlowRouter.route('/mailer/unsubscribe/:_id/:createdAt', {
	name: 'mailer-unsubscribe',
	action: () => undefined,
});

FlowRouter.notFound = {
	action: (): void => undefined,
};

Meteor.startup(() => {
	FlowRouter.initialize();
});
