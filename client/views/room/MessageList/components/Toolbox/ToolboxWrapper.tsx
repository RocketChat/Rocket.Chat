import { Message as MessageTemplate } from '@rocket.chat/fuselage';
import React, { FC, memo, useRef } from 'react';

import { IMessage } from '../../../../../../definition/IMessage';
import { useIsVisible } from '../../../hooks/useIsVisible';
import Toolbox from './Toolbox';

export const ToolboxWrapper: FC<{ message: IMessage }> = (props) => {
	const ref = useRef<HTMLInputElement>();

	const [isVisible] = useIsVisible(ref);

	return (
		<MessageTemplate.Toolbox.Wrapper ref={ref}>
			{isVisible && <Toolbox {...props} />}
		</MessageTemplate.Toolbox.Wrapper>
	);
};

export default memo(ToolboxWrapper);
