import type { IMessage } from '@rocket.chat/core-typings';
import { MessageToolboxWrapper } from '@rocket.chat/fuselage';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { Suspense, lazy, memo, useRef } from 'react';

import type { MessageActionContext } from '../../../app/ui-utils/client/lib/MessageAction';
import { useChat } from '../../views/room/contexts/ChatContext';
import { useIsVisible } from '../../views/room/hooks/useIsVisible';

type MessageToolboxHolderProps = {
	message: IMessage;
	context?: MessageActionContext;
};

const MessageToolbox = lazy(() => import('./toolbox/MessageToolbox'));

const MessageToolboxHolder = ({ message, context }: MessageToolboxHolderProps): ReactElement => {
	const ref = useRef(null);

	const [visible] = useIsVisible(ref);

	const chat = useChat();

	const depsQueryResult = useQuery(['toolbox', message._id, context], async () => {
		const room = await chat?.data.findRoom();
		const subscription = await chat?.data.findSubscription();
		return {
			room,
			subscription,
		};
	});

	return (
		<MessageToolboxWrapper ref={ref}>
			{visible && depsQueryResult.isSuccess && depsQueryResult.data.room && (
				<Suspense fallback={null}>
					<MessageToolbox
						message={message}
						messageContext={context}
						room={depsQueryResult.data.room}
						subscription={depsQueryResult.data.subscription}
					/>
				</Suspense>
			)}
		</MessageToolboxWrapper>
	);
};

export default memo(MessageToolboxHolder);
