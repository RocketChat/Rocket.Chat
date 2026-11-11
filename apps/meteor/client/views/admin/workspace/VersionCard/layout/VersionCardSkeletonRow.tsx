import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type VersionCardSkeletonRowProps = {
	width: number;
	children: ReactNode;
};

/**
 * The placeholder of one version card action item: its icon and label skeletons side by side.
 */
const VersionCardSkeletonRow = ({ width, children }: VersionCardSkeletonRowProps) => (
	<Box display='flex' width={width} height={28} alignItems='center' gap='x12'>
		{children}
	</Box>
);

export default VersionCardSkeletonRow;
