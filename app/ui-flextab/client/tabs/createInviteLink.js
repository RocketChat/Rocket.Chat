import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import toastr from 'toastr';
import s from 'underscore.string';

import { t } from '../../../utils';

function getInviteLink(instance, inviteData) {
	Meteor.call('findOrCreateInvite', inviteData, function(error, result) {
		if (error || !result) {
			toastr.error(t('Failed_to_generate_invite_link'));
			return;
		}

		instance.inviteData.set(result);
		instance.url.set(result.url);
		instance.isEditing.set(false);
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
			if (data.maxUses) {
				const usesLeft = data.maxUses - data.uses;
				return t('Your invite link will expire on {date} or after {usesLeft} uses.').replace('{date}', data.expires.toLocaleDateString()).replace('{usesLeft}', usesLeft);
			}

			return t('Your invite link will expire on {date}.').replace('{date}', data.expires.toLocaleDateString());
		}

		if (data.maxUses) {
			const usesLeft = data.maxUses - data.uses;
			return t('Your invite link will expire after {usesLeft} uses.').replace('{usesLeft}', usesLeft);
		}

		return t('Your invite link will never expire.');
	},

});

Template.createInviteLink.events({
	'click .js-edit-invite'(e, instance) {
		e.preventDefault();
		instance.isEditing.set(true);
	},

	'click .js-confirm-invite'(e, instance) {
		e.preventDefault();

		const inviteData = {
			rid: this.rid,
		};

		inviteData.days = parseInt(s.trim($('#expiration_days').val()));
		inviteData.maxUses = parseInt(s.trim($('#max_uses').val()));

		getInviteLink(instance, inviteData);
	},
});

Template.createInviteLink.onCreated(function() {
	this.isEditing = new ReactiveVar(false);
	this.isReady = new ReactiveVar(false);
	this.url = new ReactiveVar('');
	this.inviteData = new ReactiveVar(null);

	getInviteLink(this, { rid: this.data.rid });
});
