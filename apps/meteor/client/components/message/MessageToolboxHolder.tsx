import type { IMessage } from '@rocket.chat/core-typings';
import { MessageToolboxWrapper } from '@rocket.chat/fuselage';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { Suspense, lazy, memo, useRef, useState } from 'react';

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

	const [isVisible] = useIsVisible(ref);
	const [kebabOpen, setKebabOpen] = useState(false);

	const showToolbox = isVisible || kebabOpen;

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
		<MessageToolboxWrapper ref={ref} visible={kebabOpen}>
			{showToolbox && depsQueryResult.isSuccess && depsQueryResult.data.room && (
				<Suspense fallback={null}>
					<MessageToolbox
						onChangeMenuVisibility={setKebabOpen}
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
