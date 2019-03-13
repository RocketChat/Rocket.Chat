import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { APIClient } from '/app/utils';
import moment from 'moment';
import hljs from 'highlight.js';

Template.appLogs.onCreated(function() {
	const instance = this;
	this.id = new ReactiveVar(FlowRouter.getParam('appId'));
	this.ready = new ReactiveVar(false);
	this.hasError = new ReactiveVar(false);
	this.theError = new ReactiveVar('');
	this.app = new ReactiveVar({});
	this.logs = new ReactiveVar([]);

	const id = this.id.get();

	Promise.all([
		APIClient.get(`apps/${ id }`),
		APIClient.get(`apps/${ id }/logs`),
	]).then((results) => {

		instance.app.set(results[0].app);
		instance.logs.set(results[1].logs);

		this.ready.set(true);
	}).catch((e) => {
		instance.hasError.set(true);
		instance.theError.set(e.message);
	});
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
});

Template.appLogs.events({
	'click .expand': (e) => {
		$(e.currentTarget).closest('.section').removeClass('section-collapsed');
		$(e.currentTarget).closest('button').removeClass('expand').addClass('collapse').find('span').text(TAPi18n.__('Collapse'));
	},

	'click .collapse': (e) => {
		$(e.currentTarget).closest('.section').addClass('section-collapsed');
		$(e.currentTarget).closest('button').addClass('expand').removeClass('collapse').find('span').text(TAPi18n.__('Expand'));
	},
});
