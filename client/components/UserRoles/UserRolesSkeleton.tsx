import { Box, BoxProps, Skeleton } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

type UserRolesSkeletonProps = BoxProps;

const UserRolesSkeleton: FC<UserRolesSkeletonProps> = (props) => (
	<Box
		flexShrink={0}
		alignSelf='stretch'
		display='flex'
		flexWrap='wrap'
		margin={-2}
		width='20ch'
		maxWidth='100%'
		{...props}
	>
		<Box fontScale='c2' flexGrow={7} flexShrink={1} padding={2}>
			<Skeleton variant='rect' width='100%' height={16} borderRadius={4} />
		</Box>
		<Box fontScale='c2' flexGrow={5} flexShrink={1} padding={2}>
			<Skeleton variant='rect' width='100%' height={16} borderRadius={4} />
		</Box>
		<Box fontScale='c2' flexGrow={6} flexShrink={1} padding={2}>
			<Skeleton variant='rect' width='100%' height={16} borderRadius={4} />
		</Box>
	</Box>
);

export default UserRolesSkeleton;
