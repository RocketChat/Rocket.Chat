import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import toastr from 'toastr';

import { KonchatNotification } from '../app/ui/client';
import { handleError } from '../app/utils/client';
import { IUser } from '../definition/IUser';
import { renderRouteComponent } from './reactAdapters';

BlazeLayout.setRoot('body');

FlowRouter.wait();

FlowRouter.route('/', {
	name: 'index',
	action() {
		BlazeLayout.render('main', { center: 'loading' });
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

				BlazeLayout.render('main', { center: 'home' });
			});

			return;
		}

		BlazeLayout.render('main', { center: 'home' });
	},
});

FlowRouter.route('/directory/:tab?', {
	name: 'directory',
	action: () => {
		renderRouteComponent(() => import('./views/directory/DirectoryPage'), {
			template: 'main',
			region: 'center',
		});
	},
	triggersExit: [
		(): void => {
			$('.main-content').addClass('rc-old');
		},
	],
});

FlowRouter.route('/omnichannel-directory/:tab?/:context?/:id?', {
	name: 'omnichannel-directory',
	action: () => {
		renderRouteComponent(() => import('./omnichannel/directory/OmnichannelDirectoryPage'), {
			template: 'main',
			region: 'center',
		});
	},
	triggersExit: [
		(): void => {
			$('.main-content').addClass('rc-old');
		},
	],
});

FlowRouter.route('/account/:group?', {
	name: 'account',
	action: () => {
		renderRouteComponent(() => import('./views/account/AccountRoute'), {
			template: 'main',
			region: 'center',
		});
	},
	triggersExit: [
		(): void => {
			$('.main-content').addClass('rc-old');
		},
	],
});

FlowRouter.route('/terms-of-service', {
	name: 'terms-of-service',
	action: () => {
		Session.set('cmsPage', 'Layout_Terms_of_Service');
		BlazeLayout.render('cmsPage');
	},
});

FlowRouter.route('/privacy-policy', {
	name: 'privacy-policy',
	action: () => {
		Session.set('cmsPage', 'Layout_Privacy_Policy');
		BlazeLayout.render('cmsPage');
	},
});

FlowRouter.route('/legal-notice', {
	name: 'legal-notice',
	action: () => {
		Session.set('cmsPage', 'Layout_Legal_Notice');
		BlazeLayout.render('cmsPage');
	},
});

FlowRouter.route('/room-not-found/:type/:name', {
	name: 'room-not-found',
	action: ({ type, name } = {}) => {
		Session.set('roomNotFound', { type, name });
		BlazeLayout.render('main', { center: 'roomNotFound' });
	},
});

FlowRouter.route('/register/:hash', {
	name: 'register-secret-url',
	action: () => {
		BlazeLayout.render('secretURL');
	},
});

FlowRouter.route('/invite/:hash', {
	name: 'invite',
	action: () => {
		BlazeLayout.render('invite');
	},
});

FlowRouter.route('/setup-wizard/:step?', {
	name: 'setup-wizard',
	action: () => {
		renderRouteComponent(() => import('./views/setupWizard/SetupWizardRoute'));
	},
});

FlowRouter.notFound = {
	action: (): void => {
		renderRouteComponent(() => import('./views/notFound/NotFoundPage'));
	},
};

Meteor.startup(() => {
	FlowRouter.initialize();
});
