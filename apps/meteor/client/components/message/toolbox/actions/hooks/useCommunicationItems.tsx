import { useTranslation } from '@rocket.chat/ui-contexts';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { roomCoordinator } from '../../../../../client/lib/rooms/roomCoordinator';
import { messageArgs } from '../../../../../client/lib/utils/messageArgs';
import type { GenericMenuItemProps } from '../../../../GenericMenuItem';

export const useCommunicationItems = (): GenericMenuItemProps[] => {
	const t = useTranslation();

	const replyDirectlyItem: GenericMenuItemProps = {
		id: 'reply-directly',
		icon: 'reply-directly',
		content: t('Reply_in_direct_message'),
		onClick: () => {
			void 1;
		},
		// onClick: (_, props) => {
		// 	console.log(props);
		// 	const { message = messageArgs(this).msg } = props;
		// 	roomCoordinator.openRouteLink(
		// 		'd',
		// 		{ name: message.u.username },
		// 		{
		// 			...FlowRouter.current().queryParams,
		// 			reply: message._id,
		// 		},
		// 	);
		// },
	};

	const startDiscussion: GenericMenuItemProps = {
		id: 'start-discussion',
		icon: 'discussion',
		content: t('Discussion_start'),
		onClick: () => {
			void 1;
		},
	};

	return [replyDirectlyItem, startDiscussion];
};
