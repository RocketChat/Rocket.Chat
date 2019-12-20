import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';

import { t, APIClient } from '../../../utils';

function getInviteLink(instance, rid, days, maxUses) {
	APIClient.v1.post('findOrCreateInvite', {
		rid,
		days,
		maxUses,
	}).then((result) => {
		if (!result) {
			toastr.error(t('Failed_to_generate_invite_link'));
			return;
		}

		instance.inviteData.set(result);
		instance.url.set(result.url);
		instance.isEditing.set(false);
	}).catch(() => {
		toastr.error(t('Failed_to_generate_invite_link'));
	});
}

Template.createInviteLink.helpers({
	isEditing() {
		return Template.instance().isEditing.get();
	},

	isReady() {
		return Template.instance().isReady.get();
	},

	url() {
		return Template.instance().url.get();
	},

	linkExpirationText() {
		const data = Template.instance().inviteData.get();

		if (!data) {
			return '';
		}

		if (data.expires) {
			const expiration = new Date(data.expires);

			if (data.maxUses) {
				const usesLeft = data.maxUses - data.uses;
				return TAPi18n.__('Your_invite_link_will_expire_on__date__or_after__usesLeft__uses', { date: expiration.toLocaleDateString(), usesLeft });
			}

			return TAPi18n.__('Your_invite_link_will_expire_on__date__', { date: expiration.toLocaleDateString() });
		}

		if (data.maxUses) {
			const usesLeft = data.maxUses - data.uses;
			return TAPi18n.__('Your_invite_link_will_expire_after__usesLeft__uses', { usesLeft });
		}

		return t('Your_invite_link_will_never_expire');
	},

});

Template.createInviteLink.events({
	'click .js-edit-invite'(e, instance) {
		e.preventDefault();
		instance.isEditing.set(true);
	},

	'click .js-confirm-invite'(e, instance) {
		e.preventDefault();

		const { rid } = this;
		const days = parseInt($('#expiration_days').val().trim());
		const maxUses = parseInt($('#max_uses').val().trim());

		getInviteLink(instance, rid, days, maxUses);
	},
});

Template.createInviteLink.onCreated(function() {
	this.isEditing = new ReactiveVar(false);
	this.isReady = new ReactiveVar(false);
	this.url = new ReactiveVar('');
	this.inviteData = new ReactiveVar(null);

	getInviteLink(this, this.data.rid);
});
