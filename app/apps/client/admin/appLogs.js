import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { APIClient } from '../../../utils';
import moment from 'moment';
import hljs from 'highlight.js';

const loadData = (instance) => {
	Promise.all([
		APIClient.get(`apps/${ instance.id.get() }`),
		APIClient.get(`apps/${ instance.id.get() }/logs`),
	]).then((results) => {

		instance.app.set(results[0].app);
		instance.logs.set(results[1].logs);

		instance.ready.set(true);
	}).catch((e) => {
		instance.hasError.set(true);
		instance.theError.set(e.message);
	});
};

Template.appLogs.onCreated(function() {
	const instance = this;
	this.id = new ReactiveVar(FlowRouter.getParam('appId'));
	this.ready = new ReactiveVar(false);
	this.hasError = new ReactiveVar(false);
	this.theError = new ReactiveVar('');
	this.app = new ReactiveVar({});
	this.logs = new ReactiveVar([]);

	loadData(instance);
});

Template.appLogs.helpers({
	isReady() {
		if (Template.instance().ready) {
			return Template.instance().ready.get();
		}

		return false;
	},
	hasError() {
		if (Template.instance().hasError) {
			return Template.instance().hasError.get();
		}

		return false;
	},
	theError() {
		if (Template.instance().theError) {
			return Template.instance().theError.get();
		}

		return '';
	},
	app() {
		return Template.instance().app.get();
	},
	logs() {
		return Template.instance().logs.get();
	},
	formatDate(date) {
		return moment(date).format('L LTS');
	},
	jsonStringify(data) {
		let value = '';

		if (!data) {
			return value;
		} else if (typeof data === 'object') {
			value = hljs.highlight('json', JSON.stringify(data, null, 2)).value;
		} else {
			value = hljs.highlight('json', data).value;
		}

		return value.replace(/\\\\n/g, '<br>');
	},
	title() {
		return TAPi18n.__('View_the_Logs_for', { name: Template.instance().app.get().name });
	},
});

Template.appLogs.events({
	'click .section-collapsed .section-title': (e) => {
		$(e.currentTarget).closest('.section').removeClass('section-collapsed').addClass('section-expanded');
		$(e.currentTarget).find('.button-down').addClass('arrow-up');
	},

	'click .section-expanded .section-title': (e) => {
		$(e.currentTarget).closest('.section').removeClass('section-expanded').addClass('section-collapsed');
		$(e.currentTarget).find('.button-down').removeClass('arrow-up');
	},

	'click .js-cancel': (e, t) => {
		FlowRouter.go('app-manage', { appId: t.app.get().id }, { version: FlowRouter.getQueryParam('version') });
	},

	'click .js-refresh': (e, t) => {
		t.ready.set(false);
		t.logs.set([]);
		loadData(t);
	},
});
