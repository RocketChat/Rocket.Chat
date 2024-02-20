import type { IMessage } from '@rocket.chat/core-typings';
import { MessageToolbarWrapper } from '@rocket.chat/fuselage';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { Suspense, lazy, memo, useState } from 'react';

import type { MessageActionContext } from '../../../app/ui-utils/client/lib/MessageAction';
import { useChat } from '../../views/room/contexts/ChatContext';

type MessageToolbarHolderProps = {
	message: IMessage;
	context?: MessageActionContext;
};

const MessageToolbar = lazy(() => import('./toolbar/MessageToolbar'));

const MessageToolbarHolder = ({ message, context }: MessageToolbarHolderProps): ReactElement => {
	const chat = useChat();
	const [showToolbar, setShowToolbar] = useState(false);

	const depsQueryResult = useQuery(['toolbox', message._id, context], async () => {
		const room = await chat?.data.findRoom();
		const subscription = await chat?.data.findSubscription();
		return {
			room,
			subscription,
		};
	});

	return (
		<MessageToolbarWrapper visible={showToolbar}>
			{depsQueryResult.isSuccess && depsQueryResult.data.room && (
				<Suspense fallback={null}>
					<MessageToolbar
						message={message}
						messageContext={context}
						room={depsQueryResult.data.room}
						subscription={depsQueryResult.data.subscription}
						onChangeMenuVisibility={setShowToolbar}
					/>
				</Suspense>
			)}
		</MessageToolbarWrapper>
	);
};

export default memo(MessageToolbarHolder);
