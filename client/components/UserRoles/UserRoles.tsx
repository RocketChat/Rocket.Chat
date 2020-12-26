import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';
import flattenChildren from 'react-keyed-flatten-children';

type UserRolesProps = {};

const UserRoles: FC<UserRolesProps> = ({ children, ...props }) => (
	<Box
		flexWrap='wrap'
		display='flex'
		flexShrink={0}
		margin={-2}
		{...props}
	>
		{flattenChildren(children).map((child, i) => (
			<Box key={i} fontScale='c2' padding={2}>
				{child}
			</Box>
		))}
	</Box>
);

export default UserRoles;
