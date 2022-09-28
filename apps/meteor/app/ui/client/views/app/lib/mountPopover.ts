import Clipboard from 'clipboard';
import { isRoomFederated } from '@rocket.chat/core-typings';

import { popover, MessageAction } from '../../../../../ui-utils/client';
import { messageArgs } from '../../../../../../client/lib/utils/messageArgs';
import { Rooms } from '../../../../../models/client';
import { t } from '../../../../../utils/client';
import type { CommonRoomTemplateInstance } from './CommonRoomTemplateInstance';

export const mountPopover = (event: JQuery.TriggeredEvent, template: CommonRoomTemplateInstance, outerContext: unknown) => {
	let context = $(event.target).parents('.message').data('context');
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
		instance: template,
		currentTarget: event.currentTarget,
		data: outerContext,
		activeElement: $(event.currentTarget).parents('.message')[0],
		onRendered: () => new Clipboard('.rc-popover__item'),
	};

	popover.open(config);
};
