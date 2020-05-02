import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { modal } from '../../../../../app/ui-utils';
import { t, handleError, APIClient } from '../../../../../app/utils';
import { hasLicense } from '../../../license/client';
import './livechatTags.html';

const ITEMS_COUNT = 50;
const licenseEnabled = new ReactiveVar(false);

hasLicense('livechat-enterprise').then((enabled) => {
	licenseEnabled.set(enabled);
});

Template.livechatTags.helpers({
	tags() {
		return Template.instance().tags.get();
	},
	onTableScroll() {
		const instance = Template.instance();
		return function(currentTarget) {
			if (currentTarget.offsetHeight + currentTarget.scrollTop < currentTarget.scrollHeight - 100) {
				return;
			}
			const tags = instance.tags.get();
			if (instance.total.get() > tags.length) {
				instance.offset.set(instance.offset.get() + ITEMS_COUNT);
			}
		};
	},
	hasLicense() {
		return licenseEnabled.get();
	},
});

Template.livechatTags.events({
	'click .remove-tag'(e, instance) {
		e.preventDefault();
		e.stopPropagation();

		modal.open({
			title: t('Are_you_sure'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false,
		}, () => {
			Meteor.call('livechat:removeTag', this._id, function(error/* , result*/) {
				if (error) {
					return handleError(error);
				}
				instance.offset.set(0);
				instance.loadTags(instance.offset.get());
				modal.open({
					title: t('Removed'),
					text: t('Tag_removed'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false,
				});
			});
		});
	},

	'click .tag-info'(e/* , instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-tag-edit', { _id: this._id });
	},

});

Template.livechatTags.onCreated(function() {
	this.tags = new ReactiveVar([]);
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);

	this.loadTags = async (offset) => {
		const { tags, total } = await APIClient.v1.get(`livechat/tags.list?count=${ ITEMS_COUNT }&offset=${ offset }`);
		this.total.set(total);
		if (offset === 0) {
			this.tags.set(tags);
		} else {
			this.tags.set(this.tags.get().concat(tags));
		}
	};

	this.autorun(async () => {
		const offset = this.offset.get();
		this.loadTags(offset);
	});
});
