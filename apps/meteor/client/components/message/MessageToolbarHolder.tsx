import type { IMessage } from '@rocket.chat/core-typings';
import { MessageToolbarWrapper } from '@rocket.chat/fuselage';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { Suspense, lazy, memo, useState } from 'react';

import type { MessageActionContext } from '../../../app/ui-utils/client/lib/MessageAction';
import { useChat } from '../../views/room/contexts/ChatContext';
import { useIsVisible } from '../../views/room/hooks/useIsVisible';

type MessageToolbarHolderProps = {
	message: IMessage;
	context?: MessageActionContext;
};

const MessageToolbar = lazy(() => import('./toolbar/MessageToolbar'));

const MessageToolbarHolder = ({ message, context }: MessageToolbarHolderProps): ReactElement => {
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
		<MessageToolbarWrapper ref={ref} visible={isToolbarMenuOpen}>
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
		</MessageToolbarWrapper>
	);
};

export default memo(MessageToolbarHolder);
