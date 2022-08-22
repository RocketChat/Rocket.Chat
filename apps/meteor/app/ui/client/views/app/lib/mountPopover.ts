import Clipboard from 'clipboard';
import { isRoomFederated } from '@rocket.chat/core-typings';
import type { Blaze } from 'meteor/blaze';

import { popover, MessageAction } from '../../../../../ui-utils/client';
import { messageArgs } from '../../../../../../client/lib/utils/messageArgs';
import { Rooms } from '../../../../../models/client';
import { t } from '../../../../../utils/client';

export const mountPopover = (e: JQuery.TriggeredEvent, i: Blaze.TemplateInstance, outerContext: unknown) => {
	let context = $(e.target).parents('.message').data('context');
	if (!context) {
		context = 'message';
	}

	const messageContext = messageArgs(outerContext);

	const room = Rooms.findOne({ _id: messageContext.msg.rid });
	const federationContext = isRoomFederated(room) ? 'federated' : '';
	context = federationContext || context;

	let menuItems = MessageAction.getButtons({ ...messageContext, message: messageContext.msg, user: messageContext.u }, context, 'menu').map(
		(item) => ({
			icon: item.icon,
			name: t(item.label),
			type: 'message-action',
			id: item.id,
			modifier: item.color,
		}),
	);

	if (window.matchMedia('(max-width: 500px)').matches) {
		const messageItems = MessageAction.getButtons(
			{ ...messageContext, message: messageContext.msg, user: messageContext.u },
			context,
			'message',
		).map((item) => ({
			icon: item.icon,
			name: t(item.label),
			type: 'message-action',
			id: item.id,
			modifier: item.color,
		}));

		menuItems = menuItems.concat(messageItems);
	}

	const [items, deleteItem] = menuItems.reduce<[items: typeof menuItems[number][], deleteItem: typeof menuItems[number][]]>(
		(result, value) => {
			result[value.id === 'delete-message' ? 1 : 0].push(value);
			return result;
		},
		[[], []],
	);
	const groups = [{ items }];

	if (deleteItem.length) {
		groups.push({ items: deleteItem });
	}

	const config = {
		columns: [
			{
				groups,
			},
		],
		instance: i,
		currentTarget: e.currentTarget,
		data: outerContext,
		activeElement: $(e.currentTarget).parents('.message')[0],
		onRendered: () => new Clipboard('.rc-popover__item'),
	};

	popover.open(config);
};
