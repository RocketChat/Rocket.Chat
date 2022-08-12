import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { RoomHistoryManager, MessageAction } from '../../ui-utils/client';
import { messageArgs } from '../../../client/lib/utils/messageArgs';
import { settings } from '../../settings/client';
import { hasAtLeastOnePermission } from '../../authorization/client';
import { Rooms } from '../../models/client';
import { dispatchToastMessage } from '../../../client/lib/toast';
import { roomCoordinator } from '../../../client/lib/rooms/roomCoordinator';

Meteor.startup(function () {
	MessageAction.addButton({
		id: 'pin-message',
		icon: 'pin',
		label: 'Pin',
		context: ['pinned', 'message', 'message-mobile', 'threads', 'direct'],
		action(_, props) {
			const { message = messageArgs(this).msg } = props;
			message.pinned = true;
			Meteor.call('pinMessage', message, function (error: Error) {
				if (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			});
		},
		condition({ message, subscription, room }) {
			if (!settings.get('Message_AllowPinning') || message.pinned || !subscription) {
				return false;
			}
			const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
			if (isLivechatRoom) {
				return false;
			}
			return hasAtLeastOnePermission('pin-message', message.rid);
		},
		order: 7,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'unpin-message',
		icon: 'pin',
		label: 'Unpin',
		context: ['pinned', 'message', 'message-mobile', 'threads', 'direct'],
		action(_, props) {
			const { message = messageArgs(this).msg } = props;
			message.pinned = false;
			Meteor.call('unpinMessage', message, function (error: Error) {
				if (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			});
		},
		condition({ message, subscription }) {
			if (!subscription || !settings.get('Message_AllowPinning') || !message.pinned) {
				return false;
			}

			return hasAtLeastOnePermission('pin-message', message.rid);
		},
		order: 8,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'jump-to-pin-message',
		icon: 'jump',
		label: 'Jump_to_message',
		context: ['pinned', 'message-mobile', 'direct'],
		action(_, props) {
			const { message = messageArgs(this).msg } = props;
			if (window.matchMedia('(max-width: 500px)').matches) {
				(Template.instance() as any).tabBar.close();
			}
			if (message.tmid) {
				return FlowRouter.go(
					FlowRouter.getRouteName(),
					{
						tab: 'thread',
						context: message.tmid,
						rid: message.rid,
						jump: message._id,
						name: Rooms.findOne({ _id: message.rid }).name,
					},
					{
						jump: message._id,
					},
				);
			}
			return RoomHistoryManager.getSurroundingMessages(message, 50);
		},
		condition({ subscription }) {
			return !!subscription;
		},
		order: 100,
		group: ['message', 'menu'],
	});

	MessageAction.addButton({
		id: 'permalink-pinned',
		icon: 'permalink',
		label: 'Get_link',
		// classes: 'clipboard',
		context: ['pinned'],
		async action(_, props) {
			const { message = messageArgs(this).msg } = props;
			const permalink = await MessageAction.getPermaLink(message._id);
			navigator.clipboard.writeText(permalink);
			dispatchToastMessage({ type: 'success', message: TAPi18n.__('Copied') });
		},
		condition({ subscription }) {
			return !!subscription;
		},
		order: 101,
		group: 'menu',
	});
});
