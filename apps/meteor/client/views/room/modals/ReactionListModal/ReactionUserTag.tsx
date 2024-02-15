import type { IUser } from '@rocket.chat/core-typings';
import { Box, Tag } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { ReactElement, UIEvent } from 'react';
import React from 'react';

type ReactionUserTagProps = {
	username: IUser['username'];
	displayName: string;
	onOpenUserCard?: (e: UIEvent, username: string) => void;
};

const ReactionUserTag = ({ username, displayName, onOpenUserCard }: ReactionUserTagProps): ReactElement => {
	const handleOpenCard = useEffectEvent((e: UIEvent) => {
		if (!username) {
			return;
		}

		onOpenUserCard?.(e, username);
	});

	return (
		<Box mie={4} mbe={4}>
			<Tag onClick={handleOpenCard} variant='primary'>
				{displayName}
			</Tag>
		</Box>
	);
};
export default ReactionUserTag;
