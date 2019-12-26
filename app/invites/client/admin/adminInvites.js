import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import moment from 'moment';
import toastr from 'toastr';

import { t, APIClient } from '../../../utils';
import { formatDateAndTime } from '../../../lib/client/lib/formatDate';
import { modal } from '../../../ui-utils/client';

import './adminInvites.html';

Template.adminInvites.helpers({
	formatDateAndTime,
	invites() {
		return Template.instance().invites.get();
	},
	daysToExpire() {
		const { expires, days } = this;

		if (days > 0) {
			if (expires < Date.now()) {
				return t('Expired');
			}

			return moment(expires).fromNow(true);
		}

		return t('Never');
	},
	maxUsesLeft() {
		const { maxUses, uses } = this;

		if (maxUses > 0) {
			if (uses >= maxUses) {
				return 0;
			}

			return maxUses - uses;
		}

		return t('Unlimited');
	},
});

Template.adminInvites.onCreated(async function() {
	const instance = this;
	this.invites = new ReactiveVar([]);

	const result = await APIClient.v1.get('listInvites') || [];

	const invites = result.map((data) => ({
		...data,
		createdAt: new Date(data.createdAt),
		expires: data.expires ? new Date(data.expires) : '',
	}));

	instance.invites.set(invites);
});

Template.adminInvites.events({
	async 'click .js-remove'(event, instance) {
		event.stopPropagation();

		modal.open({
			text: t('Are_you_sure_you_want_to_delete_this_record'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('No'),
			closeOnConfirm: true,
			html: false,
		}, async (confirmed) => {
			if (!confirmed) {
				return;
			}

			const { currentTarget } = event;

			const { id } = currentTarget.dataset;

			try {
				await APIClient.v1.delete(`removeInvite/${ id }`);

				const invites = instance.invites.get() || [];
				invites.splice(invites.findIndex((i) => i._id === id), 1);
				instance.invites.set(invites);
			} catch (e) {
				toastr.error(t(e.error));
			}
		});
	},
});
