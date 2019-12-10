import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { t, APIClient } from '../../../utils';

Template.adminInvites.helpers({
	isReady() {
		if (Template.instance().ready != null) {
			return Template.instance().ready.get();
		}
		return undefined;
	},
	invites() {
		return Template.instance().invites.get();
	},
	isLoading() {
		if (Template.instance().ready != null) {
			if (!Template.instance().ready.get()) {
				return 'btn-loading';
			}
		}
	},
	daysToExpire() {
		const { expires, days, createdAt } = this;

		if (days > 0) {
			if (expires < new Date()) {
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

	this.autorun(function() {
		const invites = [];

		APIClient.v1.get('listInvites').then((result) => {
			if (!result) {
				return;
			}

			for (const invite of result) {
				const newInvite = {
					_id: invite._id,
					createdAt: new Date(invite.createdAt),
					expires: invite.expires ? new Date(invite.expires) : '',
					hash: invite.hash,
					days: invite.days,
					maxUses: invite.maxUses,
					rid: invite.rid,
					userId: invite.userId,
					uses: invite.uses,
				};
				invites.push(newInvite);
			}

			instance.invites.set(invites);
			instance.ready.set(true);
		}).catch(() => {

		});
	});
});
