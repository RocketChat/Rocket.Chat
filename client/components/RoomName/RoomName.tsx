import { Box, BoxProps, Icon } from '@rocket.chat/fuselage';
import React, { FC, ReactNode } from 'react';

type RoomNameProps = {
	icon?: ReactNode;
	name?: string;
} & Omit<BoxProps, 'name'>;

const RoomName: FC<RoomNameProps> = ({
	icon,
	name,
	...props
}) => (
	<Box
		{...props}
		display='flex'
		flexGrow={1}
		flexShrink={0}
		alignItems='center'
		fontScale='s2'
		color='default'
		overflow='hidden'
	>
		{icon ?? <Icon name='hashtag' size={22} />}
		<Box
			marginInline={8}
			withTruncatedText
		>
			{name}
		</Box>
	</Box>
);

export default RoomName;
