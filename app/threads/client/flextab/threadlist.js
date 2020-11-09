import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { TabBar } from '../../../ui-utils/client';
import { Subscriptions } from '../../../models/client';

Meteor.startup(function() {
	return TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'thread',
		full: true,
		i18nTitle: 'Threads',
		icon: 'thread',
		template: 'threads',
		badge: () => {
			const subscription = Subscriptions.findOne({ rid: Session.get('openedRoom') }, { fields: { tunread: 1, tunreadUser: 1, tunreadGroup: 1 } });
			if (!subscription?.tunread?.length) {
				return;
			}

			const badgeClass = (() => {
				if (subscription.tunreadUser?.length > 0) {
					return 'rc-badge--user-mentions';
				}
				if (subscription.tunreadGroup?.length > 0) {
					return 'rc-badge--group-mentions';
				}
			})();

			return {
				body: subscription.tunread.length > 99 ? '99+' : subscription.tunread.length,
				class: badgeClass,
			};
		},
		order: 2,
	});
});
