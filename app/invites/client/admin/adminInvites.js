import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { t, APIClient } from '../../../utils';

import './adminInvites.html';

Template.adminInvites.helpers({
	isReady() {
		return Template.instance().ready.get();
	},
	invites() {
		return Template.instance().invites.get();
	},
	isLoading() {
		if (!Template.instance().ready.get()) {
			return 'btn-loading';
		}
	},
	daysToExpire() {
		const { expires, days, createdAt } = this;

		if (days > 0) {
			if (expires < Date.now()) {
				return t('Expired');
			}

			return Math.ceil((expires - createdAt) / (1000 * 60 * 60 * 24));
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

Template.adminInvites.onCreated(function() {
	const instance = this;
	this.invites = new ReactiveVar([]);
	this.ready = new ReactiveVar(false);

	APIClient.v1.get('listInvites').then((result) => {
		if (!result) {
			return;
		}

		const invites = result.map((data) => ({
			...data,
			createdAt: new Date(data.createdAt),
			expires: data.expires ? new Date(data.expires) : '',
		}));

		instance.invites.set(invites);
		instance.ready.set(true);
	}).catch((err) => {
		throw err;
	});
});
