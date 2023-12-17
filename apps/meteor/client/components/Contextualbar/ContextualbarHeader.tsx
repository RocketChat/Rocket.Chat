import { ContextualbarHeader as ContextualbarHeaderComponent } from '@rocket.chat/fuselage';
import type { FC, ReactNode, ComponentProps } from 'react';
import React, { memo } from 'react';

type ContextualbarHeaderProps = {
	expanded?: boolean;
	children: ReactNode;
} & ComponentProps<typeof ContextualbarHeaderComponent>;

const ContextualbarHeader: FC<ContextualbarHeaderProps> = ({ children, expanded, ...props }) => (
	<ContextualbarHeaderComponent height={expanded ? '64px' : '56px'} {...props}>
		{children}
	</ContextualbarHeaderComponent>
);

export default memo(ContextualbarHeader);
