import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import moment from 'moment';

import { t, APIClient } from '../../../utils';

import './adminInvites.html';

Template.adminInvites.helpers({
	invites() {
		return Template.instance().invites.get();
	},
	daysToExpire() {
		const { expires, days, createdAt } = this;

		if (days > 0) {
			if (expires < Date.now()) {
				return t('Expired');
			}

			return moment(expires).diff(moment(createdAt), 'days');
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
	creationDate() {
		const { createdAt } = this;

		return createdAt.toLocaleDateString();
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
