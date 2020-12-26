import { Box, BoxProps, Skeleton } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import UserStatus from '../UserStatus';

type UserNameSkeletonProps = BoxProps;

const UserNameSkeleton: FC<UserNameSkeletonProps> = (props) => <Box
	{...props}
	display='flex'
	flexGrow={1}
	flexShrink={0}
	alignItems='center'
	fontScale='s2'
	color='default'
	overflow='hidden'
>
	<UserStatus.Loading />
	<Skeleton marginInlineStart={8} flexGrow={1} />
</Box>;

export default UserNameSkeleton;
