/* globals ChatOAuthApps */
import toastr from 'toastr';

Template.oauthApp.onCreated(function() {
	this.subscribe('oauthApps');
	this.record = new ReactiveVar({
		active: true
	});
});

Template.oauthApp.helpers({
	hasPermission() {
		return RocketChat.authz.hasAllPermission('manage-oauth-apps');
	},
	data() {
		const instance = Template.instance();
		if (typeof instance.data.params === 'function') {
			const params = instance.data.params();
			if (params && params.id) {
				const data = ChatOAuthApps.findOne({ _id: params.id });
				if (data) {
					data.authorization_url = Meteor.absoluteUrl('oauth/authorize');
					data.access_token_url = Meteor.absoluteUrl('oauth/token');
					Template.instance().record.set(data);
					return data;
				}
			}
		}
		return Template.instance().record.curValue;
	}
});

Template.oauthApp.events({
	'click .submit > .delete'() {
		const params = Template.instance().data.params();
		swal({
			title: t('Are_you_sure'),
			text: t('You_will_not_be_able_to_recover'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes_delete_it'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false
		}, function() {
			Meteor.call('deleteOAuthApp', params.id, function() {
				swal({
					title: t('Deleted'),
					text: t('Your_entry_has_been_deleted'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false
				});
				FlowRouter.go('admin-oauth-apps');
			});
		});
	},
	'click .submit > .save'() {
		const instance = Template.instance();
		const name = $('[name=name]').val().trim();
		const active = $('[name=active]:checked').val().trim() === '1';
		const redirectUri = $('[name=redirectUri]').val().trim();
		if (name === '') {
			return toastr.error(TAPi18n.__('The_application_name_is_required'));
		}
		if (redirectUri === '') {
			return toastr.error(TAPi18n.__('The_redirectUri_is_required'));
		}
		const app = {
			name,
			active,
			redirectUri
		};
		if (typeof instance.data.params === 'function') {
			const params = instance.data.params();
			if (params && params.id) {
				return Meteor.call('updateOAuthApp', params.id, app, function(err) {
					if (err != null) {
						return handleError(err);
					}
					toastr.success(TAPi18n.__('Application_updated'));
				});
			}
		}
		Meteor.call('addOAuthApp', app, function(err, data) {
			if (err != null) {
				return handleError(err);
			}
			toastr.success(TAPi18n.__('Application_added'));
			FlowRouter.go('admin-oauth-app', { id: data._id });
		});
	}
});
