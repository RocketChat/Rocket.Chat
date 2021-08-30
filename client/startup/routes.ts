import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import toastr from 'toastr';

import { KonchatNotification } from '../../app/ui/client';
import { handleError } from '../../app/utils/client';
import { appLayout } from '../lib/appLayout';

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
	action: () => undefined,
});

FlowRouter.route('/omnichannel-directory/:page?/:bar?/:id?/:tab?/:context?', {
	name: 'omnichannel-directory',
	action: () => undefined,
});

FlowRouter.route('/account/:group?', {
	name: 'account',
	action: () => undefined,
});

FlowRouter.route('/terms-of-service', {
	name: 'terms-of-service',
	action: () => undefined,
});

FlowRouter.route('/privacy-policy', {
	name: 'privacy-policy',
	action: () => undefined,
});

FlowRouter.route('/legal-notice', {
	name: 'legal-notice',
	action: () => undefined,
});

FlowRouter.route('/room-not-found/:type/:name', {
	name: 'room-not-found',
	action: () => undefined,
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
