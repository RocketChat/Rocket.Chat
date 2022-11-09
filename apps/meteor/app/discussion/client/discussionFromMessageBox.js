import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { isRoomFederated } from '@rocket.chat/core-typings';

import { messageBox } from '../../ui-utils/client';
import { settings } from '../../settings/client';
import { hasPermission } from '../../authorization/client';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import CreateDiscussion from '../../../client/components/CreateDiscussion/CreateDiscussion';
import { Rooms } from '../../models/client';

Meteor.startup(function () {
	Tracker.autorun(() => {
		if (!settings.get('Discussion_enabled')) {
			return messageBox.actions.remove('Create_new', /start-discussion/);
		}
		messageBox.actions.add('Create_new', 'Discussion', {
			id: 'start-discussion',
			icon: 'discussion',
			condition: () => {
				const room = Rooms.findOne(Session.get('openedRoom'));
				if (!room) {
					return false;
				}
				return (hasPermission('start-discussion') || hasPermission('start-discussion-other-user')) && !isRoomFederated(room);
			},
			action(data) {
				imperativeModal.open({
					component: CreateDiscussion,
					props: {
						defaultParentRoom: data.prid || data.rid,
						onClose: imperativeModal.close,
					},
				});
			},
		});
	});
});
