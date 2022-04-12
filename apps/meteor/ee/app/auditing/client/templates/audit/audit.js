import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { hasAllPermission } from '../../../../../../app/authorization/client';
import { messageContext } from '../../../../../../app/ui-utils/client/lib/messageContext';
import { call } from '../../utils.js';

import './audit.html';

const loadMessages = async function ({ rid, users, startDate, endDate = new Date(), msg, type, visitor, agent }) {
	this.messages = this.messages || new ReactiveVar([]);
	this.loading = this.loading || new ReactiveVar(true);
	try {
		this.loading.set(true);
		const messages =
			type === 'l'
				? await call('auditGetOmnichannelMessages', {
						rid,
						users,
						startDate,
						endDate,
						msg,
						type,
						visitor,
						agent,
				  })
				: await call('auditGetMessages', {
						rid,
						users,
						startDate,
						endDate,
						msg,
						type,
						visitor,
						agent,
				  });
		this.messagesContext.set({
			...messageContext({ rid }),
			messages,
		});
	} catch (e) {
		this.messagesContext.set({});
	} finally {
		this.loading.set(false);
	}
};

Template.audit.helpers({
	isLoading() {
		return Template.instance().loading.get();
	},
	messageContext() {
		return Template.instance().messagesContext.get();
	},
	hasResults() {
		return Template.instance().hasResults.get();
	},
});

Template.audit.onCreated(async function () {
	this.messagesContext = new ReactiveVar({});
	this.loading = new ReactiveVar(false);
	this.hasResults = new ReactiveVar(false);

	if (!hasAllPermission('can-audit')) {
		return FlowRouter.go('/home');
	}

	this.autorun(() => {
		const messagesContext = this.messagesContext.get();

		this.hasResults.set(messagesContext && messagesContext.messages && messagesContext.messages.length > 0);
	});

	this.loadMessages = loadMessages.bind(this);

	const { visitor, agent, users, rid } = this.data;
	if (rid || users.length || agent || visitor) {
		await this.loadMessages(this.data);
	}
});
