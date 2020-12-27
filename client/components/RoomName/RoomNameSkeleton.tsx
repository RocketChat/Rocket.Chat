import { Box, BoxProps, Skeleton } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

type RoomNameSkeletonProps = BoxProps;

const RoomNameSkeleton: FC<RoomNameSkeletonProps> = (props) => <Box
	{...props}
	display='flex'
	flexGrow={1}
	flexShrink={0}
	alignItems='center'
	fontScale='s2'
	color='default'
	overflow='hidden'
>
	<Skeleton variant='rect' width={22} height={22}/>
	<Skeleton marginInlineStart={8} flexGrow={1} />
</Box>;

export default RoomNameSkeleton;
