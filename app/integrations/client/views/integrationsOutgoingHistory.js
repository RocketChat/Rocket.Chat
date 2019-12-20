import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';
import hljs from 'highlight.js';
import moment from 'moment';
import toastr from 'toastr';

import { handleError } from '../../../utils';
import { hasAllPermission, hasAtLeastOnePermission } from '../../../authorization';
import { integrations } from '../../lib/rocketchat';
import { SideNav } from '../../../ui-utils/client';
import { APIClient } from '../../../utils/client';

const HISTORY_COUNT = 25;

Template.integrationsOutgoingHistory.onCreated(async function _integrationsOutgoingHistoryOnCreated() {
	const params = Template.instance().data.params ? Template.instance().data.params() : undefined;
	this.isLoading = new ReactiveVar(false);
	this.history = new ReactiveVar([]);
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);

	if (params && params.id) {
		let integration;
		const baseUrl = `integrations.get?integrationId=${ params.id }`;
		if (hasAllPermission('manage-outgoing-integrations')) {
			const { integration: record } = await APIClient.v1.get(baseUrl);
			integration = record;
		} else if (hasAllPermission('manage-own-outgoing-integrations')) {
			const { integration: record } = await APIClient.v1.get(`${ baseUrl }&createdBy=${ Meteor.userId() }`);
			integration = record;
		}
		if (!integration) {
			toastr.error(TAPi18n.__('No_integration_found'));
			return FlowRouter.go('admin-integrations');
		}
		this.autorun(async () => {
			this.isLoading.set(true);
			const { history, total } = await APIClient.v1.get(`integrations.history?id=${ integration._id }&count=${ HISTORY_COUNT }&offset=${ this.offset.get() }`);
			this.history.set(this.history.get().concat(history));
			this.total.set(total);
			this.isLoading.set(false);
		});
	} else {
		toastr.error(TAPi18n.__('No_integration_found'));
		FlowRouter.go('admin-integrations');
	}
});

Template.integrationsOutgoingHistory.helpers({
	hasPermission() {
		return hasAtLeastOnePermission(['manage-outgoing-integrations', 'manage-own-outgoing-integrations']);
	},

	isLoading() {
		return Template.instance().isLoading.get();
	},

	histories() {
		return Template.instance().history.get().sort((a, b) => {
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
		} if (history.finished) {
			return 'icon-ok-circled success-color';
		}
		return 'icon-help-circled';
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
		return TAPi18n.__(integrations.outgoingEvents[event].label);
	},

	jsonStringify(data) {
		if (!data) {
			return '';
		} if (typeof data === 'object') {
			return hljs.highlight('json', JSON.stringify(data, null, 2)).value;
		}
		return hljs.highlight('json', data).value;
	},

	integrationId() {
		return this.params && this.params() && this.params().id;
	},
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
		const history = instance.history.get();
		if ((e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight) && instance.total.get() > history.length) {
			instance.offset.set(instance.offset.get() + HISTORY_COUNT);
		}
	}, 200),
});

Template.integrationsOutgoingHistory.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});
