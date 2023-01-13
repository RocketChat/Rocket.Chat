import type { IMessage } from '@rocket.chat/core-typings';
import { MessageToolboxWrapper } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React, { memo, useRef } from 'react';

import { useIsVisible } from '../../views/room/hooks/useIsVisible';
import Toolbox from './toolbox/Toolbox';

type ToolboxHolderProps = {
	message: IMessage;
};

export const ToolboxHolder = (props: ToolboxHolderProps): ReactElement => {
	const ref = useRef(null);

	const [visible] = useIsVisible(ref);

	return <MessageToolboxWrapper ref={ref}>{visible && <Toolbox {...props} />}</MessageToolboxWrapper>;
};

export default memo(ToolboxHolder);
