import { Message as MessageTemplate } from '@rocket.chat/fuselage';
import React, { FC, memo, useRef } from 'react';

import { useIsVisible } from '../../../hooks/useIsVisible';
import Toolbox from './Toolbox';

export const ToolboxWrapper: FC<{}> = () => {
	const ref = useRef<HTMLInputElement>();

	const [isVisible] = useIsVisible(ref);

	return (
		<MessageTemplate.Toolbox.Wrapper ref={ref}>
			{isVisible && <Toolbox />}
		</MessageTemplate.Toolbox.Wrapper>
	);
};

export default memo(ToolboxWrapper);
