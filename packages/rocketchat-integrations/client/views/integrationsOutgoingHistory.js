/* global ChatIntegrationHistory, hljs */
import moment from 'moment';

Template.integrationsOutgoingHistory.helpers({
	hasPermission() {
		return RocketChat.authz.hasAtLeastOnePermission(['manage-integrations', 'manage-own-integrations']);
	},

	histories() {
		return ChatIntegrationHistory.find().fetch().sort((a, b) => {
			if (+a._updatedAt < +b._updatedAt) {
				return 1;
			}

			if (+a._updatedAt > +b._updatedAt) {
				return -1;
			}

			return 0;
		});
	},

	iconClass(error) {
		return typeof error !== 'undefined' && error ? 'icon-cancel-circled error-color' : 'icon-ok-circled success-color';
	},

	statusI18n(error) {
		return typeof error !== 'undefined' && error ? TAPi18n.__('Failure') : TAPi18n.__('Success');
	},

	formatDate(date) {
		return moment(date).format('L LT');
	},

	eventTypei18n(event) {
		return TAPi18n.__(RocketChat.integrations.outgoingEvents[event].label);
	},

	jsonStringify(data) {
		return hljs.highlight('json', JSON.stringify(data, null, 2)).value;
	}
});

Template.integrationsOutgoingHistory.events({
	'click .expand': (e) => {
		$(e.currentTarget).closest('.section').removeClass('section-collapsed');
		$(e.currentTarget).closest('button').removeClass('expand').addClass('collapse').find('span').text(TAPi18n.__('Collapse'));
		$('.CodeMirror').each((index, codeMirror) => codeMirror.CodeMirror.refresh());
	},

	'click .collapse': (e) => {
		$(e.currentTarget).closest('.section').addClass('section-collapsed');
		$(e.currentTarget).closest('button').addClass('expand').removeClass('collapse').find('span').text(TAPi18n.__('Expand'));
	},

	'click .replay': (e) => {
		console.log($(e.currentTarget).attr('data-history-id'));
	}
});
