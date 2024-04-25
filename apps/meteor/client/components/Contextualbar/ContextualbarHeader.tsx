import { ContextualbarHeader as ContextualbarHeaderComponent } from '@rocket.chat/fuselage';
import type { FC, ReactNode, ComponentProps } from 'react';
import React, { memo } from 'react';

type ContextualbarHeaderProps = {
	children: ReactNode;
} & ComponentProps<typeof ContextualbarHeaderComponent>;

const ContextualbarHeader: FC<ContextualbarHeaderProps> = ({ children, ...props }) => (
	<ContextualbarHeaderComponent {...props}>{children}</ContextualbarHeaderComponent>
);

export default memo(ContextualbarHeader);
