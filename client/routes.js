import mem from 'mem';
import s from 'underscore.string';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Tracker } from 'meteor/tracker';
import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { KonchatNotification } from '../app/ui';
import { ChatSubscription } from '../app/models';
import { roomTypes } from '../app/utils';
import { call } from '../app/ui-utils';

const getRoomById = mem((rid) => call('getRoomById', rid));

FlowRouter.goToRoomById = async (rid) => {
	if (!rid) {
		return;
	}
	const subscription = ChatSubscription.findOne({ rid });
	if (subscription) {
		return roomTypes.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
	}

	const room = await getRoomById(rid);
	return roomTypes.openRouteLink(room.t, room, FlowRouter.current().queryParams);
};


BlazeLayout.setRoot('body');

const createTemplateForComponent = async (
	component,
	props = {},
	// eslint-disable-next-line new-cap
	renderContainerView = () => HTML.DIV()
) => {
	const React = await import('react');
	const ReactDOM = await import('react-dom');
	const { MeteorProvider } = await import('./components/providers/MeteorProvider');

	const name = component.displayName || component.name;

	if (!name) {
		throw new Error('the component must have a name');
	}

	if (Template[name]) {
		Template[name].props.set(props);
		return name;
	}

	Template[name] = new Blaze.Template(name, renderContainerView);

	Template[name].props = new ReactiveVar(props);

	Template[name].onRendered(() => {
		Template.instance().autorun((computation) => {
			if (computation.firstRun) {
				Template.instance().container = Template.instance().firstNode;
			}

			ReactDOM.render(
				React.createElement(MeteorProvider, {
					children: React.createElement(() => React.createElement(component, Template[name].props.get())),
				}), Template.instance().firstNode);
		});
	});

	Template[name].onDestroyed(() => {
		if (Template.instance().container) {
			ReactDOM.unmountComponentAtNode(Template.instance().container);
		}
	});

	return name;
};

FlowRouter.subscriptions = function() {
	Tracker.autorun(() => {
		if (Meteor.userId()) {
			this.register('userData', Meteor.subscribe('userData'));
		}
	});
};

FlowRouter.route('/', {
	name: 'index',
	action() {
		BlazeLayout.render('main', { center: 'loading' });
		if (!Meteor.userId()) {
			return FlowRouter.go('home');
		}

		Tracker.autorun(function(c) {
			if (FlowRouter.subsReady() === true) {
				Meteor.defer(function() {
					if (Meteor.user() && Meteor.user().defaultRoom) {
						const room = Meteor.user().defaultRoom.split('/');
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

	action(params, queryParams) {
		KonchatNotification.getDesktopPermission();
		if (queryParams.saml_idp_credentialToken !== undefined) {
			Accounts.callLoginMethod({
				methodArguments: [{
					saml: true,
					credentialToken: queryParams.saml_idp_credentialToken,
				}],
				userCallback() { BlazeLayout.render('main', { center: 'home' }); },
			});
		} else {
			BlazeLayout.render('main', { center: 'home' });
		}
	},
});

FlowRouter.route('/directory', {
	name: 'directory',

	action() {
		BlazeLayout.render('main', { center: 'directory' });
	},
	triggersExit: [function() {
		$('.main-content').addClass('rc-old');
	}],
});

FlowRouter.route('/account/:group?', {
	name: 'account',

	action(params) {
		if (!params.group) {
			params.group = 'Preferences';
		}
		params.group = s.capitalize(params.group, true);
		BlazeLayout.render('main', { center: `account${ params.group }` });
	},
	triggersExit: [function() {
		$('.main-content').addClass('rc-old');
	}],
});

FlowRouter.route('/terms-of-service', {
	name: 'terms-of-service',

	action() {
		Session.set('cmsPage', 'Layout_Terms_of_Service');
		BlazeLayout.render('cmsPage');
	},
});

FlowRouter.route('/privacy-policy', {
	name: 'privacy-policy',

	action() {
		Session.set('cmsPage', 'Layout_Privacy_Policy');
		BlazeLayout.render('cmsPage');
	},
});

FlowRouter.route('/legal-notice', {
	name: 'legal-notice',

	action() {
		Session.set('cmsPage', 'Layout_Legal_Notice');
		BlazeLayout.render('cmsPage');
	},
});

FlowRouter.route('/room-not-found/:type/:name', {
	name: 'room-not-found',

	action(params) {
		Session.set('roomNotFound', { type: params.type, name: params.name });
		BlazeLayout.render('main', { center: 'roomNotFound' });
	},
});

FlowRouter.route('/register/:hash', {
	name: 'register-secret-url',

	action(/* params*/) {
		BlazeLayout.render('secretURL');

		// if RocketChat.settings.get('Accounts_RegistrationForm') is 'Secret URL'
		// 	Meteor.call 'checkRegistrationSecretURL', params.hash, (err, success) ->
		// 		if success
		// 			Session.set 'loginDefaultState', 'register'
		// 			BlazeLayout.render 'main', {center: 'home'}
		// 			KonchatNotification.getDesktopPermission()
		// 		else
		// 			BlazeLayout.render 'logoLayout', { render: 'invalidSecretURL' }
		// else
		// 	BlazeLayout.render 'logoLayout', { render: 'invalidSecretURL' }
	},
});

FlowRouter.route('/setup-wizard/:step?', {
	name: 'setup-wizard',
	action: async () => {
		const { SetupWizard } = await import('./components/setupWizard/SetupWizard');
		BlazeLayout.render(await createTemplateForComponent(SetupWizard));
	},
});

FlowRouter.route('/admin/users', {
	name: 'admin-users',
	action() {
		BlazeLayout.render('main', { center: 'adminUsers' });
	},
});

FlowRouter.route('/admin/rooms', {
	name: 'admin-rooms',
	action() {
		BlazeLayout.render('main', { center: 'adminRooms' });
	},
});

FlowRouter.route('/admin/import', {
	name: 'admin-import',
	action() {
		BlazeLayout.render('main', { center: 'adminImport' });
	},
});

FlowRouter.route('/admin/import/history', {
	name: 'admin-import-history',
	action() {
		BlazeLayout.render('main', { center: 'adminImportHistory' });
	},
});

FlowRouter.route('/admin/import/prepare/:importer', {
	name: 'admin-import-prepare',
	action() {
		BlazeLayout.render('main', { center: 'adminImportPrepare' });
	},
});

FlowRouter.route('/admin/import/progress/:importer', {
	name: 'admin-import-progress',
	action() {
		BlazeLayout.render('main', { center: 'adminImportProgress' });
	},
});

FlowRouter.route('/admin/:group?', {
	name: 'admin',
	action: async ({ group = 'info' } = {}) => {
		switch (group) {
			case 'info': {
				const { InformationRoute } = await import('./components/admin/info/InformationRoute');
				BlazeLayout.render('main', { center: await createTemplateForComponent(InformationRoute) });
				break;
			}

			default:
				BlazeLayout.render('main', { center: 'admin' });
		}
	},
});

FlowRouter.notFound = {
	action: async () => {
		const { PageNotFound } = await import('./components/pageNotFound/PageNotFound');
		BlazeLayout.render(await createTemplateForComponent(PageNotFound));
	},
};
