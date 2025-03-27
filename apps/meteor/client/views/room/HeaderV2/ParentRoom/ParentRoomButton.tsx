import { IconButton, Skeleton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

type ParentRoomButtonProps = Omit<ComponentProps<typeof IconButton>, 'icon'> & { loading: boolean };

const ParentRoomButton = ({ loading, ...props }: ParentRoomButtonProps) => {
	if (loading) {
		return <Skeleton variant='rect' size={28} />;
	}

	return <IconButton small icon='arrow-back-up' {...props} />;
};

export default ParentRoomButton;
