import { Box, Tag } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

const ReactionUserTag = ({ displayName }: { displayName: string }): ReactElement => (
	<Box mie={4} mbe={4}>
		<Tag variant='primary'>{displayName}</Tag>
	</Box>
);

export default ReactionUserTag;
