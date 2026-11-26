import type { IMessage } from '@rocket.chat/core-typings';
import { useIsVisible } from '@rocket.chat/ui-client';
import { useQuery } from '@tanstack/react-query';
import { Suspense, lazy, memo, useState } from 'react';

import MessageToolbarReveal from './toolbar/MessageToolbarReveal';
import type { MessageActionContext } from '../../lib/MessageAction';
import { useChat } from '../../views/room/contexts/ChatContext';

export type MessageToolbarHolderProps = {
	message: IMessage;
	context?: MessageActionContext;
};

const MessageToolbar = lazy(() => import('./toolbar/MessageToolbar'));

const MessageToolbarHolder = ({ message, context }: MessageToolbarHolderProps) => {
	const chat = useChat();
	const [ref, isVisible] = useIsVisible();
	const [isToolbarMenuOpen, setIsToolbarMenuOpen] = useState(false);

	const showToolbar = isVisible || isToolbarMenuOpen;

	const depsQueryResult = useQuery({
		queryKey: ['toolbox', message._id, context],

		queryFn: async () => {
			const room = await chat?.data.findRoom();
			const subscription = await chat?.data.findSubscription();
			return {
				room,
				subscription,
			};
		},

		enabled: showToolbar,
	});

	return (
		<MessageToolbarReveal ref={ref} visible={isToolbarMenuOpen}>
			{showToolbar && depsQueryResult.isSuccess && depsQueryResult.data.room && (
				<Suspense fallback={null}>
					<MessageToolbar
						message={message}
						messageContext={context}
						room={depsQueryResult.data.room}
						subscription={depsQueryResult.data.subscription}
						onChangeMenuVisibility={setIsToolbarMenuOpen}
					/>
				</Suspense>
			)}
		</MessageToolbarReveal>
	);
};

export default memo(MessageToolbarHolder);
