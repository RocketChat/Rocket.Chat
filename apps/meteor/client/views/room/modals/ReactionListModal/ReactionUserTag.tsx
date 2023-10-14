import type { IUser } from '@rocket.chat/core-typings';
import { Box, Tag } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

type ReactionUserTagProps = {
	username: IUser['username'];
	onClick: (e: React.MouseEvent<HTMLElement>) => void;
	displayName: string;
};

const ReactionUserTag = ({ username, onClick, displayName }: ReactionUserTagProps): ReactElement => (
	<Box mie={4} mbe={4} data-username={username} onClick={onClick} key={displayName}>
		<Tag variant='primary'>{displayName}</Tag>
	</Box>
);

export default ReactionUserTag;
