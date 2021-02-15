import React, { memo, FC } from 'react';
import { Box, Chip } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import UserAvatar from './avatar/UserAvatar';

interface ITagProps {
	item: {
		name: string;
		status?: string;
		username?: string;
	};
}

const Tag: FC<ITagProps> = ({ item }) => {
	const displayName = item.username ?? item.name;

	const onClickRemove = useMutableCallback(
		(e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
			e.stopPropagation();
			e.preventDefault();
		},
	);

	return (
		<Chip
			key={displayName}
			height='x20'
			value={displayName}
			onClick={onClickRemove}
			mie='x4'
		>
			<UserAvatar size='x20' username={displayName} etag='' />
			<Box is='span' margin='none' mis='x4' value={displayName}>
				{displayName}
			</Box>
		</Chip>
	);
};

export default memo(Tag);
