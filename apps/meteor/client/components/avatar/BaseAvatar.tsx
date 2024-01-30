import type { AvatarProps } from '@rocket.chat/fuselage';
import { Avatar, Skeleton } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { useState } from 'react';
import { useRoomToolbox } from '../../views/room/contexts/RoomToolboxContext';
import { useTranslation } from '@rocket.chat/ui-contexts';

export type BaseAvatarProps = Omit<AvatarProps, 'is'>;

const BaseAvatar: FC<BaseAvatarProps> = ({ onError, ...props }) => {
	const [isLoading, setIsLoading] = useState<unknown>(false);
	const t = useTranslation();
	if (isLoading) {
		return <Skeleton aria-hidden variant='rect' onError={onError} {...props} />;
	}
	const toolbox = useRoomToolbox();
	const { actions, openTab } = toolbox;
	console.log(actions);
	console.log(props);
	const handleClick = () => {
		openTab(actions[0]?.id);
	}
	return (
		<Avatar
			aria-hidden
			title={t(actions[0]?.title)}
			onClick={handleClick}
			onError={(event) => {
				setIsLoading(true);
				onError?.(event);
			}}
			{...props}
		/>
	);
};

export default BaseAvatar;
