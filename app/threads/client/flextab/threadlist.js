import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { TabBar } from '../../../ui-utils/client';
import { Subscriptions } from '../../../models/client';

Meteor.startup(function() {
	return TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'thread',
		i18nTitle: 'Threads',
		icon: 'thread',
		template: 'threads',
		badge: () => {
			const subscription = Subscriptions.findOne({ rid: Session.get('openedRoom') }, { fields: { tunread: 1 } });
			if (subscription) {
				return subscription.tunread && subscription.tunread.length && { body: subscription.tunread.length > 99 ? '99+' : subscription.tunread.length };
			}
		},
		order: 1,
	});
});
