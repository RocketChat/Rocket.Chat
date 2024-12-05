import { ContextualbarV2Header } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import React, { memo } from 'react';

type ContextualbarHeaderProps = {
	children: ReactNode;
} & ComponentPropsWithoutRef<typeof ContextualbarV2Header>;

const ContextualbarHeader = (props: ContextualbarHeaderProps) => <ContextualbarV2Header mbs={-1} {...props} />;

export default memo(ContextualbarHeader);
