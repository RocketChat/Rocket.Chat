import moment from 'moment';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { hasAllPermission } from '../../../../../../app/authorization';
import { call, convertDate } from '../../utils.js';

import './auditLog.html';

const loadLog = async function({ startDate, endDate = new Date() }) {
	this.logs = this.logs || new ReactiveVar([]);
	this.loading = this.loading || new ReactiveVar(false);
	if (this.loading.get() === true) {
		return;
	}
	this.loading.set(true);
	try {
		const logs = await call('auditGetAuditions', { startDate, endDate });
		this.logs.set(logs);
	} catch (e) {
		this.logs.set([]);
	} finally {
		this.loading.set(false);
	}
};

Template.auditLog.events({
	'click button'(e, t) {
		const form = e.currentTarget.parentElement;
		t.loadLog({
			startDate: convertDate(form.startDate.value),
			endDate: new Date(convertDate(form.endDate.value).getTime() + 86400000),
		});
	},
});

Template.auditLog.helpers({
	logs() {
		return Template.instance().logs.get();
	},
});

Template.auditLog.onRendered(function() {
	this.loadLog = loadLog.bind(this);
});

Template.auditLog.onCreated(function() {
	this.logs = new ReactiveVar([]);

	if (!hasAllPermission('can-audit-log')) {
		return FlowRouter.go('/home');
	}
});

Template.auditLogItem.helpers({
	msg() {
		return this.fields.msg;
	},
	username() {
		return this.u.username;
	},
	ts() {
		return moment(this.ts).format('lll');
	},
	fields() {
		const { fields } = this;

		const from = fields.users ? `<b>@${ fields.users[0] }</b> : <b>@${ fields.users[1] }</b>` : `<b>#${ fields.room }</b>`;

		return `${ from } <p>${ moment(fields.startDate).format('DD/MM/YYYY') } to ${ moment(fields.endDate).format('DD/MM/YYYY') }</p> `;
	},
});
