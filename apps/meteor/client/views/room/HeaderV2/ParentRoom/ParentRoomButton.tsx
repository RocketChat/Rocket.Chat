import { IconButton, Skeleton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

type ParentRoomButtonProps = Omit<ComponentProps<typeof IconButton>, 'icon'> & { loading: boolean };

const ParentRoomButton = ({ loading, ...props }: ParentRoomButtonProps) => {
	if (loading) {
		return <Skeleton mie={4} variant='rect' size={28} />;
	}

	return <IconButton mie={4} small icon='arrow-back' {...props} />;
};

export default ParentRoomButton;
