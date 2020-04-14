import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import _ from 'underscore';
import toastr from 'toastr';

import { t, handleError, APIClient } from '../../../../../app/utils';
import { hasLicense } from '../../../license/client';
import './livechatTagForm.html';

const licenseEnabled = new ReactiveVar(false);

hasLicense('livechat-enterprise').then((enabled) => {
	licenseEnabled.set(enabled);
});

const availableDepartments = () => {
	const selected = Template.instance().selectedDepartments.get().map((dept) => dept._id);
	const enabledDepartments = Template.instance().availableDepartments.get().filter((dept) => dept.enabled === true);
	if (selected && selected.length) {
		return enabledDepartments.filter((dept) => !selected.includes(dept._id));
	}
	return enabledDepartments;
};

Template.livechatTagForm.helpers({
	tag() {
		return Template.instance().tag.get();
	},
	departments() {
		return Template.instance().tag && !_.isEmpty(Template.instance().tag.get()) ? Template.instance().tag.get().departments : [];
	},
	selectedDepartments() {
		return _.sortBy(Template.instance().selectedDepartments.get(), 'name');
	},
	availableDepartments,
	hasAvailableDepartments() {
		return availableDepartments().length > 0;
	},
	hasLicense() {
		return licenseEnabled.get();
	},
});

Template.livechatTagForm.events({
	'submit #tag-form'(e, instance) {
		e.preventDefault();
		const $btn = instance.$('button.save');

		const _id = $(e.currentTarget).data('id');
		const name = instance.$('input[name=name]').val();

		if (name.trim() === '') {
			return toastr.error(t('Please_fill_a_name'));
		}

		const description = instance.$('textarea[name=description]').val();

		const oldBtnValue = $btn.html();
		$btn.html(t('Saving'));

		const tagData = {
			name: name.trim(),
			description: description.trim(),
		};

		const tagDepartments = _.pluck(Template.instance().selectedDepartments.get(), '_id');
		Meteor.call('livechat:saveTag', _id, tagData, tagDepartments, function(error/* , result*/) {
			$btn.html(oldBtnValue);
			if (error) {
				return handleError(error);
			}

			toastr.success(t('Saved'));
			FlowRouter.go('livechat-tags');
		});
	},

	'click button.back'(e/* , instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-tags');
	},

	'click .remove-department'(e, instance) {
		e.preventDefault();

		let selectedDepartments = instance.selectedDepartments.get();
		selectedDepartments = _.reject(selectedDepartments, (department) => department._id === this._id);
		instance.selectedDepartments.set(selectedDepartments);
	},

	'click .available-departments li'(e, instance) {
		const selectedDepartments = instance.selectedDepartments.get();
		selectedDepartments.push(this);
		instance.selectedDepartments.set(selectedDepartments);
	},
});

Template.livechatTagForm.onCreated(function() {
	this.tag = new ReactiveVar(null);
	this.selectedDepartments = new ReactiveVar([]);
	this.availableDepartments = new ReactiveVar([]);

	this.autorun(async () => {
		const id = FlowRouter.getParam('_id');
		const { departments } = await APIClient.v1.get('livechat/department');
		this.availableDepartments.set(departments);
		if (id) {
			const tag = await APIClient.v1.get(`livechat/tags.getOne?tagId=${ id }`);
			this.tag.set(tag);
			const { departments: tagDepartments = [] } = tag;
			this.selectedDepartments.set(departments.filter((dept) => tagDepartments.includes(dept._id)));
		}
	});
});
