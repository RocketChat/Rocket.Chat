import { Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

const PreviewSkeleton = (): ReactElement => <Skeleton variant='rect' w='full' h='x200' />;

export default PreviewSkeleton;
