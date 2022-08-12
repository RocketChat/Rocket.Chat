import { Skeleton } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

const PreviewSkeleton = (): ReactElement => <Skeleton variant='rect' w='full' h='x200' />;

export default PreviewSkeleton;
