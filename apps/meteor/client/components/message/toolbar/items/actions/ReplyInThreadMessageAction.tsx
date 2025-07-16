import { type IMessage, type ISubscription, type IRoom, isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useRouter, useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import MessageToolbarItem from '../../MessageToolbarItem';

type ReplyInThreadMessageActionProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const ReplyInThreadMessageAction = ({ message, room, subscription }: ReplyInThreadMessageActionProps) => {
	const router = useRouter();
	const threadsEnabled = useSetting('Threads_enabled', true);
	const { t } = useTranslation();

	if (!threadsEnabled || isOmnichannelRoom(room) || !subscription) {
		return null;
	}

	return (
		<MessageToolbarItem
			id='reply-in-thread'
			icon='thread'
			title={t('Reply_in_thread')}
			qa='Reply_in_thread'
			onClick={(event) => {
				event.stopPropagation();
				const routeName = router.getRouteName();

				if (routeName) {
					router.navigate({
						name: routeName,
						params: {
							...router.getRouteParameters(),
							tab: 'thread',
							context: message.tmid || message._id,
						},
					});
				}
			}}
		/>
	);
};

export default ReplyInThreadMessageAction;
