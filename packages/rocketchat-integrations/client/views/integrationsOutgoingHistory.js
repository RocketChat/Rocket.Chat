/* global ChatIntegrations, ChatIntegrationHistory */

import _ from 'underscore';
import hljs from 'highlight.js';
import moment from 'moment';
import toastr from 'toastr';

Template.integrationsOutgoingHistory.onCreated(function _integrationsOutgoingHistoryOnCreated() {
	this.hasMore = new ReactiveVar(false);
	this.limit = new ReactiveVar(25);
	this.autorun(() => {
		const id = this.data && this.data.params && this.data.params().id;

		if (id) {
			const sub = this.subscribe('integrations');
			if (sub.ready()) {
				let intRecord;

				if (RocketChat.authz.hasAllPermission('manage-integrations')) {
					intRecord = ChatIntegrations.findOne({ _id: id });
				} else if (RocketChat.authz.hasAllPermission('manage-own-integrations')) {
					intRecord = ChatIntegrations.findOne({ _id: id, '_createdBy._id': Meteor.userId() });
				}

				if (!intRecord) {
					toastr.error(TAPi18n.__('No_integration_found'));
					FlowRouter.go('admin-integrations');
				}

				const historySub = this.subscribe('integrationHistory', intRecord._id, this.limit.get());
				if (historySub.ready()) {
					if (ChatIntegrationHistory.find().count() > this.limit.get()) {
						this.hasMore.set(true);
					}
				}
			}
		} else {
			toastr.error(TAPi18n.__('No_integration_found'));
			FlowRouter.go('admin-integrations');
		}
	});
});

Template.integrationsOutgoingHistory.helpers({
	hasPermission() {
		return RocketChat.authz.hasAtLeastOnePermission(['manage-integrations', 'manage-own-integrations']);
	},

	hasMore() {
		return Template.instance().hasMore.get();
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

	hasProperty(history, property) {
		return typeof history[property] !== 'undefined' || history[property] != null;
	},

	iconClass(history) {
		if (typeof history.error !== 'undefined' && history.error) {
			return 'icon-cancel-circled error-color';
		} else if (history.finished) {
			return 'icon-ok-circled success-color';
		} else {
			return 'icon-help-circled';
		}
	},

	statusI18n(error) {
		return typeof error !== 'undefined' && error ? TAPi18n.__('Failure') : TAPi18n.__('Success');
	},

	formatDate(date) {
		return moment(date).format('L LTS');
	},

	formatDateDetail(date) {
		return moment(date).format('L HH:mm:ss:SSSS');
	},

	eventTypei18n(event) {
		return TAPi18n.__(RocketChat.integrations.outgoingEvents[event].label);
	},

	jsonStringify(data) {
		if (!data) {
			return '';
		} else if (typeof data === 'object') {
			return hljs.highlight('json', JSON.stringify(data, null, 2)).value;
		} else {
			return hljs.highlight('json', data).value;
		}
	},

	integrationId() {
		return this.params && this.params() && this.params().id;
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

	'click .replay': (e, t) => {
		if (!t || !t.data || !t.data.params || !t.data.params().id) {
			return;
		}

		const historyId = $(e.currentTarget).attr('data-history-id');

		Meteor.call('replayOutgoingIntegration', { integrationId: t.data.params().id, historyId }, (e) => {
			if (e) {
				handleError(e);
				return;
			}
		});
	},

	'click .clear-history': (e, t) => {
		if (!t || !t.data || !t.data.params || !t.data.params().id) {
			return;
		}

		Meteor.call('clearIntegrationHistory', t.data.params().id, (e) => {
			if (e) {
				handleError(e);
				return;
			}

			toastr.success(TAPi18n.__('Integration_History_Cleared'));
		});
	},

	'scroll .content': _.throttle((e, instance) => {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight) {
			instance.limit.set(instance.limit.get() + 25);
		}
	}, 200)
});
