import type { IMessage } from '@rocket.chat/core-typings';
import { MessageToolboxWrapper } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { memo, useRef } from 'react';

import { useIsVisible } from '../../../hooks/useIsVisible';
import Toolbox from './Toolbox';

export const ToolboxWrapper: FC<{ message: IMessage }> = (props) => {
	const ref = useRef(null);

	const [isVisible] = useIsVisible(ref);

	return <MessageToolboxWrapper ref={ref}>{isVisible && <Toolbox {...props} />}</MessageToolboxWrapper>;
};

export default memo(ToolboxWrapper);
