import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { ChatSubscription } from '../../../../models/client';
import { menu } from '../../../../ui-utils/client';
import { isLayoutEmbedded } from '../../../../../client/lib/utils/isLayoutEmbedded';
import { getUserPreference } from '../../../../utils';

Template.burger.helpers({
	unread() {
		const userUnreadAlert = getUserPreference(Meteor.userId(), 'unreadAlert');
		const [unreadCount, unreadAlert] = ChatSubscription.find(
			{
				open: true,
				hideUnreadStatus: { $ne: true },
				rid: { $ne: Session.get('openedRoom') },
				archived: { $ne: true },
			},
			{
				fields: {
					unread: 1,
					alert: 1,
					unreadAlert: 1,
				},
			},
		)
			.fetch()
			.reduce(
				([unreadCount, unreadAlert], { alert, unread, unreadAlert: alertType }) => {
					if (alert || unread > 0) {
						unreadCount += unread;
						if (alert === true && alertType !== 'nothing') {
							if (alertType === 'all' || userUnreadAlert !== false) {
								unreadAlert = '•';
							}
						}
					}

					return [unreadCount, unreadAlert];
				},
				[0, false],
			);

		if (unreadCount > 0) {
			return unreadCount > 99 ? '99+' : unreadCount;
		}

		return unreadAlert || '';
	},

	isMenuOpen() {
		if (Session.equals('isMenuOpen', true)) {
			return 'menu-opened';
		}
	},

	embeddedVersion() {
		return isLayoutEmbedded();
	},
});

Template.burger.events({
	'click div.burger'() {
		return menu.toggle();
	},
});
