import React, { FC } from 'react';
import { Tag, TagProps } from '@rocket.chat/fuselage';

type UserRolesItemProps = TagProps;

const UserRolesItem: FC<UserRolesItemProps> = (props) => (
	<Tag disabled {...props} />
);

export default UserRolesItem;
