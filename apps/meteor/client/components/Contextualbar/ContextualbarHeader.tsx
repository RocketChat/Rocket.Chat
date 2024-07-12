import { ContextualbarHeader as ContextualbarHeaderComponent } from '@rocket.chat/fuselage';
import type { ReactNode, ComponentPropsWithoutRef } from 'react';
import React, { memo } from 'react';

type ContextualbarHeaderProps = {
	expanded?: boolean;
	children: ReactNode;
} & ComponentPropsWithoutRef<typeof ContextualbarHeaderComponent>;

const ContextualbarHeader = ({ children, expanded, ...props }: ContextualbarHeaderProps) => (
	<ContextualbarHeaderComponent height={expanded ? '64px' : '56px'} {...props}>
		{children}
	</ContextualbarHeaderComponent>
);

export default memo(ContextualbarHeader);
