import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { CannedResponse } from '../../collections/CannedResponse';
import { t } from '../../../../../../app/utils';
import { chatMessages } from '../../../../../../app/ui/client';
import { handleError } from '../../../../../../client/lib/utils/handleError';
import { dispatchToastMessage } from '../../../../../../client/lib/toast';

import './cannedResponses.html';

Template.cannedResponses.helpers({
	cannedResponses() {
		const searchText = Template.instance().searchText.get().toLocaleLowerCase();

		let query = {};

		if (Template.instance().context.get() === 'department') {
			query = {
				scope: 'department',
				departmentId: Template.instance().departmentId,
			};
		}

		if (searchText) {
			const regex = new RegExp(searchText, 'i');
			query.$or = [
				{
					shortcut: {
						$regex: regex,
					},
				},
				{
					text: {
						$regex: regex,
					},
				},
			];
		}
		return CannedResponse.find(query);
	},

	hasNoCannedResponses() {
		return CannedResponse.find().count() === 0;
	},

	isDetailScreen() {
		return ['edit', 'new', 'view'].includes(Template.instance().action.get());
	},

	isNewResponse() {
		return Template.instance().action.get() === 'new';
	},

	isExistingResponse() {
		return ['edit', 'view'].includes(Template.instance().action.get());
	},

	isUserContext() {
		return Template.instance().context.get() === 'user';
	},

	searchText() {
		return Template.instance().searchText.get();
	},

	isDepartmentContext() {
		return Template.instance().context.get() === 'department';
	},

	cannedResponse() {
		return Template.instance().cannedResponse.get();
	},

	canDeleteResponse() {
		const action = Template.instance().action.get();

		if (action !== 'edit') {
			return false;
		}

		const response = Template.instance().cannedResponse.get();
		const context = Template.instance().context.get();

		return response.scope === context;
	},

	canModifyResponse() {
		const action = Template.instance().action.get();

		if (action === 'new') {
			return true;
		}

		const response = Template.instance().cannedResponse.get();
		const context = Template.instance().context.get();

		return response.scope === context;
	},

	createdByString() {
		const username = this.createdBy;

		const me = Meteor.users.findOne(Meteor.userId());

		if (me.username === username) {
			return t('Me');
		}

		return username;
	},

	isPreviewMode() {
		return Template.instance().action.get() === 'view';
	},
});

Template.cannedResponses.events({
	'click .new-canned-response-btn'(e, instance) {
		e.preventDefault();
		e.stopPropagation();

		instance.cannedResponse.set({
			shortcut: '',
			text: '',
		});
		instance.action.set('new');
	},

	'click .canned-response'(e, instance) {
		e.preventDefault();
		e.stopPropagation();

		const { _id } = this;

		const cannedResponse = CannedResponse.findOne({ _id });
		if (!cannedResponse) {
			dispatchToastMessage({ type: 'success', message: t('Invalid Canned Response') });
		}

		instance.cannedResponse.set(cannedResponse);
		const canEdit = instance.context.get() === cannedResponse.scope;

		instance.action.set(canEdit ? 'edit' : 'view');
	},

	'click .delete-canned-response'(e, instance) {
		e.preventDefault();
		e.stopPropagation();

		const _id = instance.$('input[name=id]').val();

		Meteor.call('removeCannedResponse', _id, (error) => {
			if (error) {
				return handleError(error);
			}

			dispatchToastMessage({ type: 'success', message: t('Canned_Response_Removed') });
			instance.action.set(null);
		});
	},

	'click .cancel-canned-response-btn'(e, instance) {
		e.preventDefault();
		e.stopPropagation();

		instance.action.set(null);
	},

	'click .use-canned-response-btn'(e, instance) {
		e.preventDefault();
		e.stopPropagation();

		const { rid } = Template.currentData();
		if (!rid) {
			return;
		}

		const object = instance.cannedResponse.get();
		const { input } = chatMessages[rid];
		const { text } = object;

		if (document.selection) {
			input.focus();
			const sel = document.selection.createRange();
			sel.text = text;
			return;
		}

		if (input.selectionStart || input.selectionStart === 0) {
			const startPos = input.selectionStart;
			const endPos = input.selectionEnd;

			const prefix = input.value.substring(0, startPos);
			const suffix = input.value.substring(endPos, input.value.length);

			input.value = `${prefix}${text}${suffix}`;
			input.selectionStart = startPos + text.length;
			input.selectionEnd = startPos + text.length;

			input.focus();
			instance.action.set(null);
			return;
		}

		input.value += text;
	},

	'click .save-canned-response-btn'(e, instance) {
		e.preventDefault();
		e.stopPropagation();

		const _id = instance.$('input[name=id]').val();
		const shortcut = instance.$('input[name=shortcut]').val();
		const text = instance.$('textarea[name=text]').val();

		const responseData = {
			shortcut,
			text,
		};

		const context = instance.context.get();
		if (context === 'department') {
			if (!instance.departmentId) {
				dispatchToastMessage({ type: 'error', message: t('Invalid_Department') });
				return;
			}

			responseData.scope = 'department';
			responseData.departmentId = instance.departmentId;
		} else {
			responseData.scope = 'user';
		}

		Meteor.call('saveCannedResponse', _id, responseData, function (error /* , result*/) {
			if (error) {
				return handleError(error);
			}

			dispatchToastMessage({ type: 'success', message: t('Saved') });
			instance.action.set(null);
		});
	},

	'keyup .js-search'(event, instance) {
		instance.searchText.set(event.currentTarget.value || '');
	},
});

Template.cannedResponses.onCreated(function () {
	this.action = new ReactiveVar();
	this.context = new ReactiveVar();
	this.cannedResponse = new ReactiveVar();
	this.searchText = new ReactiveVar('');
	this.departmentId = null;

	if (this.data && this.data.context) {
		this.context.set(this.data.context);

		if (this.data.context === 'department') {
			this.departmentId = this.data.departmentId;
		}
	} else {
		this.context.set('user');
	}
});
