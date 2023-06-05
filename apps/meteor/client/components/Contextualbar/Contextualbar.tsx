import { Contextualbar as ContextualbarComponent } from '@rocket.chat/fuselage';
import { useLayoutSizes, useLayoutContextualBarPosition } from '@rocket.chat/ui-contexts';
import type { FC, ComponentProps } from 'react';
import React, { memo } from 'react';

import ContextualbarResizable from './ContextualbarResizable';

// FIXME: Check the behavior for the `ContextualbarInnerContent`
const Contextualbar: FC<ComponentProps<typeof ContextualbarComponent>> = ({ children, bg = 'room', ...props }) => {
	const sizes = useLayoutSizes();
	const position = useLayoutContextualBarPosition();

	return (
		<ContextualbarResizable defaultWidth={sizes.contextualBar}>
			<ContextualbarComponent bg={bg} position={position} {...props}>
				{children}
			</ContextualbarComponent>
		</ContextualbarResizable>
	);
};

export default memo(Contextualbar);
