import { useTranslation } from '@rocket.chat/ui-contexts';
import { IMessage, ITranslatedMessage } from '@rocket.chat/core-typings';

import type { GenericMenuItemProps } from '../../../../GenericMenuItem';

import { messageArgs } from '/client/lib/utils/messageArgs';

export type MessageActionConfig = {
	action: (
		e: Pick<Event, 'preventDefault' | 'stopPropagation'>,
		{
			message,
		}: // tabbar,
		// room,
		// chat,
		// autoTranslateOptions,
		{
			message?: IMessage & Partial<ITranslatedMessage>;
			// tabbar: ToolboxContextValue;
			// room?: IRoom;
			// chat: ContextType<typeof ChatContext>;
			// autoTranslateOptions?: AutoTranslateOptions;
		},
	) => any;
	// condition?: (props: MessageActionConditionProps) => Promise<boolean> | boolean;
};

export const useInteractionItems = (): GenericMenuItemProps[] => {
	const t = useTranslation();

	const pinMessage: GenericMenuItemProps = {
		id: 'pin-message',
		icon: 'pin',
		content: t('Pin'),
		onClick: () => {
			// (_, props): MessageActionConfig => {
			// 	const { message = messageArgs(this).msg } = props;
			// 	message.pinned = true;
			// 	try {
			// 		await sdk.call('pinMessage', message);
			// 		queryClient.invalidateQueries(['rooms', message.rid, 'pinned-messages']);
			// 	} catch (error) {
			// 		dispatchToastMessage({ type: 'error', message: error });
			// 	}
			// },
		},
		// onClick: (_, props) => {
		// 	const { message = messageArgs(this).msg } = props;
		// 	message.pinned = true;
		// 	try {
		// 		await sdk.call('pinMessage', message);
		// 		queryClient.invalidateQueries(['rooms', message.rid, 'pinned-messages']);
		// 	} catch (error) {
		// 		dispatchToastMessage({ type: 'error', message: error });
		// 	}
		// },
	};

	return [pinMessage];
};
