import { Skeleton } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

import GenericModal from './GenericModal';

export type GenericModalSkeletonProps = ComponentPropsWithoutRef<typeof GenericModal>;

const GenericModalSkeleton = (props: GenericModalSkeletonProps) => (
	<GenericModal {...props} icon={null} title={<Skeleton width='50%' />}>
		<Skeleton width='full' />
	</GenericModal>
);

export default GenericModalSkeleton;
