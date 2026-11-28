import { IconButton, Skeleton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type ParentRoomButtonProps = Omit<ComponentProps<typeof IconButton>, 'icon'> & { loading: boolean };

const ParentRoomButton = ({ loading, ...props }: ParentRoomButtonProps) => {
	if (loading) {
		return <Skeleton variant='rect' width={28} height={28} />;
	}

	return <IconButton size='small' icon='arrow-back-up' {...props} />;
};

export default ParentRoomButton;
