import type { ILivechatAgent, ILivechatVisitor, IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import type { Blaze } from 'meteor/blaze';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';
import type { TemplateStatic } from 'meteor/templating';
import { Template } from 'meteor/templating';

import { hasAllPermission } from '../../../../app/authorization/client';
import { createMessageContext } from '../../../../app/ui-utils/client/lib/messageContext';
import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';

import './audit.html';
import './audit.css';

const loadMessages = async function (
	this: TemplateStatic['audit'] extends Blaze.Template<any, infer I> ? I : never,
	{
		type,
		msg,
		startDate,
		endDate = new Date(),
		rid,
		users,
		visitor,
		agent,
	}: {
		type: string;
		msg: IMessage['msg'];
		startDate: Date;
		endDate?: Date;
		rid: IRoom['_id'];
		users: IUser['username'][];
		visitor: ILivechatVisitor['_id'];
		agent: ILivechatAgent['_id'];
	},
) {
	try {
		this.loading.set(true);
		const messages =
			type === 'l'
				? await callWithErrorHandling('auditGetOmnichannelMessages', {
						users,
						startDate,
						endDate,
						msg,
						type,
						visitor,
						agent,
				  })
				: await callWithErrorHandling('auditGetMessages', {
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
			...createMessageContext({ rid }),
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
		return Template.instance<'audit'>().loading.get();
	},
	messageContext() {
		return Template.instance<'audit'>().messagesContext.get();
	},
	hasResults() {
		return Template.instance<'audit'>().hasResults.get();
	},
});

Template.audit.onCreated(async function () {
	this.messagesContext = new ReactiveVar({});
	this.loading = new ReactiveVar(false);
	this.hasResults = new ReactiveVar(false);
	this.messages = new ReactiveVar([]);

	if (!hasAllPermission('can-audit')) {
		return FlowRouter.go('/home');
	}

	this.autorun(() => {
		const messagesContext = this.messagesContext.get();

		this.hasResults.set(messagesContext?.messages ? messagesContext.messages.length > 0 : false);
	});

	this.loadMessages = loadMessages.bind(this);

	const { visitor, agent, users, rid } = this.data;
	if (rid || users?.length || agent || visitor) {
		await this.loadMessages(this.data);
	}
});
