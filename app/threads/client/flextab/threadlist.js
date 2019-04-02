import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { TabBar } from '../../../ui-utils/client';
import { Subscriptions } from '../../../models/client';

Meteor.startup(function() {
	return TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'thread',
		i18nTitle: 'threads',
		icon: 'thread',
		template: 'threads',
		badge: () => {
			const subscription = Subscriptions.findOne({ rid: Session.get('openedRoom') }, { fields: { tunread: 1 } });

			if (subscription) {
				return subscription.tunread && { body: subscription.tunread.length };
			}
		},
		order: 1,
	});
});
