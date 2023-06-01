import { Contextualbar as ContextualbarComponent } from '@rocket.chat/fuselage';
import { useLayoutSizes, useLayoutContextualBarPosition } from '@rocket.chat/ui-contexts';
import type { FC, ComponentProps } from 'react';
import React, { memo } from 'react';

const Contextualbar: FC<ComponentProps<typeof ContextualbarComponent>> = ({ children, bg = 'room', ...props }) => {
	const sizes = useLayoutSizes();
	const position = useLayoutContextualBarPosition();

	return (
		<ContextualbarComponent bg={bg} width={sizes.contextualBar} position={position} {...props}>
			{children}
		</ContextualbarComponent>
	);
};

export default memo(Contextualbar);
