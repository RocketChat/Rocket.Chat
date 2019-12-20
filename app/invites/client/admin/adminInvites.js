import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import moment from 'moment';

import { t, APIClient } from '../../../utils';
import { formatDateAndTime } from '../../../lib/client/lib/formatDate';

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

			return moment(expires).fromNow();
		}

		return t('Never');
	},
	maxUsesLeft() {
		const { maxUses, uses } = this;

		if (maxUses > 0) {
			if (uses >= maxUses) {
				return t('None');
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
