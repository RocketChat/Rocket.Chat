import { Skeleton } from '@rocket.chat/fuselage';

import VersionCardSkeletonRow from '../layout/VersionCardSkeletonRow';

export const VersionCardSkeleton = () => {
	return (
		<>
			<Skeleton height={28} width={160} />
			<Skeleton height={28} width={150} />
			<VersionCardSkeletonRow width={160}>
				<Skeleton height={38} width={28} />
				<Skeleton height={20} width={120} />
			</VersionCardSkeletonRow>
			<VersionCardSkeletonRow width={180}>
				<Skeleton height={38} width={28} />
				<Skeleton height={20} width={140} />
			</VersionCardSkeletonRow>
			<VersionCardSkeletonRow width={160}>
				<Skeleton height={38} width={28} />
				<Skeleton height={20} width={120} />
			</VersionCardSkeletonRow>
			<Skeleton height={50} width={160} />
		</>
	);
};
