import { ContextualbarV2Skeleton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

const ContextualbarSkeleton = (props: ComponentProps<typeof ContextualbarV2Skeleton>) => <ContextualbarV2Skeleton {...props} />;

export default memo(ContextualbarSkeleton);
