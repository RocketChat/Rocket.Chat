import type { IMessage, ToolboxMessageType } from '@rocket.chat/core-typings';
import { MessageToolboxWrapper } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React, { memo, useRef } from 'react';

import { useIsVisible } from '../../views/room/hooks/useIsVisible';
import Toolbox from './toolbox/Toolbox';

type ToolboxHolderProps = {
	message: IMessage;
	context?: ToolboxMessageType;
};

export const ToolboxHolder = ({ message, context }: ToolboxHolderProps): ReactElement => {
	const ref = useRef(null);

	const [visible] = useIsVisible(ref);

	return <MessageToolboxWrapper ref={ref}>{visible && <Toolbox message={message} messageContext={context} />}</MessageToolboxWrapper>;
};

export default memo(ToolboxHolder);
