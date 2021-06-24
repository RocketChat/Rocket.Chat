import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { handleError, t } from '../../../utils';
import { modal } from '../../../ui-utils';

Template.oembedInfo.helpers({
	urls() {
		const oembed = Template.instance().oembed.get();
		return oembed.urls;
	},

	endPoint() {
		const oembed = Template.instance().oembed.get();
		return oembed.endPoint;
	},

	oembed() {
		return Template.instance().oembed.get();
	},

	editingOembed() {
		return Template.instance().editingOembed.get();
	},

	oembedToEdit() {
		const instance = Template.instance();
		return {
			tabBar: this.tabBar,
			oembed: instance.oembed.get(),
			onSuccess: instance.onSuccess,
			back(endPoint) {
				instance.editingOembed.set();

				if (endPoint != null) {
					const oembed = instance.oembed.get();
					if (oembed != null && oembed.endPoint != null && oembed.endPoint !== endPoint) {
						return instance.loadedEndPoint.set(endPoint);
					}
				}
			},
		};
	},
});

Template.oembedInfo.events({
	'click .thumb'(e) {
		$(e.currentTarget).toggleClass('bigger');
	},

	'click .delete'(e, instance) {
		e.stopPropagation();
		e.preventDefault();
		const oembed = instance.oembed.get();
		if (oembed != null) {
			const { _id } = oembed;
			modal.open({
				title: t('Are_you_sure'),
				text: t('OEmbed_Delete_Warning'),
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#DD6B55',
				confirmButtonText: t('Yes_delete_it'),
				cancelButtonText: t('Cancel'),
				closeOnConfirm: false,
				html: false,
			}, function() {
				Meteor.call('deleteOembed', _id, (error/* , result */) => {
					if (error) {
						return handleError(error);
					}
					modal.open({
						title: t('Deleted'),
						text: t('OEmbed_Has_Been_Deleted'),
						type: 'success',
						timer: 2000,
						showConfirmButton: false,
					});
					instance.onSuccess();

					instance.tabBar.close();
				});
			});
		}
	},

	'click .edit-oembed'(e, instance) {
		e.stopPropagation();
		e.preventDefault();

		instance.editingOembed.set(instance.oembed.get()._id);
	},
});

Template.oembedInfo.onCreated(function() {
	this.oembed = new ReactiveVar();
	this.onSuccess = Template.currentData().onSuccess;

	this.editingOembed = new ReactiveVar();

	this.loadedEndPoint = new ReactiveVar();

	this.tabBar = Template.currentData().tabBar;

	this.autorun(() => {
		const data = Template.currentData();
		if (data != null && data.clear != null) {
			this.clear = data.clear;
		}
	});

	this.autorun(() => {
		const data = Template.currentData().oembed;
		const oembed = this.oembed.get();
		if (oembed != null && oembed.endPoint != null) {
			this.loadedEndPoint.set(oembed.endPoint);
		} else if (data != null && data.endPoint != null) {
			this.loadedEndPoint.set(data.endPoint);
		}
	});

	this.autorun(() => {
		const data = Template.currentData().oembed;
		this.oembed.set(data);
	});
});
