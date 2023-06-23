import { Contextualbar as ContextualbarComponent } from '@rocket.chat/fuselage';
import { useLayoutContextualbar } from '@rocket.chat/ui-contexts';
import type { FC, ComponentProps } from 'react';
import React, { memo } from 'react';

import ContextualbarResizable from './ContextualbarResizable';

const ContextualbarContainer: FC<ComponentProps<typeof ContextualbarComponent>> = ({ children, bg = 'room', ...props }) => {
	const { size, position } = useLayoutContextualbar();

	return (
		<ContextualbarResizable defaultWidth={size}>
			<ContextualbarComponent bg={bg} position={position} {...props}>
				{children}
			</ContextualbarComponent>
		</ContextualbarResizable>
	);
};

export default memo(ContextualbarContainer);
