import { MessageToolbox } from '@rocket.chat/fuselage';
import React, { FC, memo, useEffect, useRef, useState } from 'react';

import { IMessage } from '../../../../../../definition/IMessage';
import { useIsVisible } from '../../../hooks/useIsVisible';
import Toolbox from './Toolbox';

export const ToolboxWrapper: FC<{ message: IMessage }> = (props) => {
	const ref = useRef<HTMLInputElement>();

	const [isVisible] = useIsVisible(ref);

	return (
		<MessageToolbox.Wrapper ref={ref}>{isVisible && <Toolbox {...props} />}</MessageToolbox.Wrapper>
	);
};

export default memo(ToolboxWrapper);
