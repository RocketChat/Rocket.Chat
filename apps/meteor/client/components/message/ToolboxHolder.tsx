import type { IMessage } from '@rocket.chat/core-typings';
import { MessageToolboxWrapper } from '@rocket.chat/fuselage';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { memo, useRef } from 'react';

import type { MessageActionContext } from '../../../app/ui-utils/client/lib/MessageAction';
import { useChat } from '../../views/room/contexts/ChatContext';
import { useIsVisible } from '../../views/room/hooks/useIsVisible';
import Toolbox from './toolbox/Toolbox';

type ToolboxHolderProps = {
	message: IMessage;
	context?: MessageActionContext;
};

export const ToolboxHolder = ({ message, context }: ToolboxHolderProps): ReactElement => {
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
				<Toolbox
					message={message}
					messageContext={context}
					room={depsQueryResult.data.room}
					subscription={depsQueryResult.data.subscription}
				/>
			)}
		</MessageToolboxWrapper>
	);
};

export default memo(ToolboxHolder);
